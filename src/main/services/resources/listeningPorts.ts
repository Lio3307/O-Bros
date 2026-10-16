import { shell } from 'electron'
import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import type { ListeningPort } from '../../../shared/types'
import { listRunningTerminals } from '../ptyManager'
import { listBackgroundProcesses } from './backgroundProcesses'
import {
  parseLsofFields,
  parseWindowsNetstat,
  removeDuplicateSockets,
  type ListeningSocket
} from './portParsers'
import { collectProcessTree, readProcessTable } from './processTable'

const execFileAsync = promisify(execFile)
const MAX_OUTPUT_BYTES = 10 * 1024 * 1024
const HIGHEST_PORT = 65_535

async function readListeningSockets(): Promise<ListeningSocket[]> {
  if (process.platform === 'win32') {
    const { stdout } = await execFileAsync('netstat', ['-ano', '-p', 'tcp'], {
      maxBuffer: MAX_OUTPUT_BYTES,
      windowsHide: true
    })
    return parseWindowsNetstat(stdout)
  }
  try {
    const { stdout } = await execFileAsync('lsof', ['-nP', '-iTCP', '-sTCP:LISTEN', '-Fpn'], {
      maxBuffer: MAX_OUTPUT_BYTES
    })
    return parseLsofFields(stdout)
  } catch {
    return []
  }
}

export async function readListeningPorts(): Promise<ListeningPort[]> {
  const terminals = listRunningTerminals()
  if (terminals.length === 0) {
    return []
  }

  const [table, sockets] = await Promise.all([readProcessTable(), readListeningSockets()])
  const ports: ListeningPort[] = []

  for (const { id, pid } of terminals) {
    const processes = listBackgroundProcesses(collectProcessTree(table, pid), pid)
    for (const socket of removeDuplicateSockets(sockets)) {
      const owner = processes.find((entry) => entry.pid === socket.pid)
      if (owner !== undefined) {
        ports.push({ port: socket.port, pid: socket.pid, processName: owner.name, paneId: id })
      }
    }
  }
  return ports.sort((first, second) => first.port - second.port)
}

export async function stopListeningProcess(pid: number): Promise<void> {
  const ports = await readListeningPorts()
  if (!ports.some((entry) => entry.pid === pid)) {
    throw new Error('That process is not one of your terminals.')
  }
  process.kill(pid)
}

export async function openListeningPort(port: number): Promise<void> {
  if (!Number.isInteger(port) || port < 1 || port > HIGHEST_PORT) {
    throw new Error('That is not a valid port.')
  }
  await shell.openExternal(`http://localhost:${port}`)
}
