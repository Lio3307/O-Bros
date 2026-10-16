import { execFile } from 'node:child_process'
import { promisify } from 'node:util'

const execFileAsync = promisify(execFile)

const MAX_OUTPUT_BYTES = 20 * 1024 * 1024
const HUNDRED_NANOSECONDS_PER_MILLISECOND = 10_000
const BYTES_PER_KILOBYTE = 1024
const UNIX_COLUMN_COUNT = 4
const FIRST_PRINTABLE_CODE = 32

export interface ProcessEntry {
  pid: number
  parentPid: number
  workingSetBytes: number
  privateBytes: number
  cpuTimeMs: number | null
  cpuPercent: number | null
  name: string
  commandLine: string
}

interface WindowsProcessRow {
  ProcessId: number
  ParentProcessId: number
  Name: string | null
  CommandLine: string | null
  WorkingSetSize: number | null
  PrivatePageCount: number | null
  KernelModeTime: number | null
  UserModeTime: number | null
}

const LOWER_PRIORITY = "[System.Diagnostics.Process]::GetCurrentProcess().PriorityClass = 'BelowNormal'; "

const WINDOWS_QUERY =
  LOWER_PRIORITY +
  'Get-CimInstance Win32_Process | Select-Object ProcessId,ParentProcessId,Name,CommandLine,WorkingSetSize,PrivatePageCount,KernelModeTime,UserModeTime | ConvertTo-Json -Compress'

export function withoutControlCharacters(text: string): string {
  let cleaned = ''
  for (const character of text) {
    cleaned += character.charCodeAt(0) < FIRST_PRINTABLE_CODE ? ' ' : character
  }
  return cleaned
}

async function readWindowsProcessTable(): Promise<ProcessEntry[]> {
  const { stdout } = await execFileAsync('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', WINDOWS_QUERY], {
    maxBuffer: MAX_OUTPUT_BYTES,
    windowsHide: true
  })
  const parsed = JSON.parse(withoutControlCharacters(stdout)) as WindowsProcessRow | WindowsProcessRow[]
  const rows = Array.isArray(parsed) ? parsed : [parsed]

  return rows.map((row) => ({
    pid: row.ProcessId,
    parentPid: row.ParentProcessId,
    workingSetBytes: row.WorkingSetSize ?? 0,
    privateBytes: row.PrivatePageCount ?? 0,
    cpuTimeMs: ((row.KernelModeTime ?? 0) + (row.UserModeTime ?? 0)) / HUNDRED_NANOSECONDS_PER_MILLISECOND,
    cpuPercent: null,
    name: row.Name ?? '',
    commandLine: row.CommandLine ?? row.Name ?? ''
  }))
}

async function readUnixProcessTable(): Promise<ProcessEntry[]> {
  const { stdout } = await execFileAsync('ps', ['-A', '-o', 'pid=,ppid=,rss=,pcpu=,args='], {
    maxBuffer: MAX_OUTPUT_BYTES
  })

  return stdout
    .split('\n')
    .map((line) => line.trim().split(' ').filter((part) => part !== ''))
    .filter((columns) => columns.length >= UNIX_COLUMN_COUNT)
    .map(([pid, parentPid, rssKilobytes, cpuPercent, ...commandParts]) => {
      const bytes = Number(rssKilobytes) * BYTES_PER_KILOBYTE
      return {
        pid: Number(pid),
        parentPid: Number(parentPid),
        workingSetBytes: bytes,
        privateBytes: bytes,
        cpuTimeMs: null,
        cpuPercent: Number(cpuPercent),
        name: commandParts[0] ?? '',
        commandLine: commandParts.join(' ')
      }
    })
}

let tableInFlight: Promise<ProcessEntry[]> | null = null

export function readProcessTable(): Promise<ProcessEntry[]> {
  if (tableInFlight === null) {
    const read = process.platform === 'win32' ? readWindowsProcessTable() : readUnixProcessTable()
    tableInFlight = read.finally(() => {
      tableInFlight = null
    })
  }
  return tableInFlight
}

export function collectProcessTree(table: ProcessEntry[], rootPid: number): ProcessEntry[] {
  const childrenByParent = new Map<number, ProcessEntry[]>()
  for (const entry of table) {
    const siblings = childrenByParent.get(entry.parentPid) ?? []
    siblings.push(entry)
    childrenByParent.set(entry.parentPid, siblings)
  }

  const root = table.find((entry) => entry.pid === rootPid)
  if (root === undefined) {
    return []
  }

  const tree: ProcessEntry[] = []
  const pending = [root]
  while (pending.length > 0) {
    const current = pending.pop() as ProcessEntry
    tree.push(current)
    pending.push(...(childrenByParent.get(current.pid) ?? []).filter((child) => child.pid !== current.pid))
  }
  return tree
}
