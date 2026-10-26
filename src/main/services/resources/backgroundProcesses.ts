import type { ProcessEntry } from './processTable'
import { distinctProgramNames, friendlyProgramName } from './programNames'

const CONSOLE_HELPER_NAMES = ['conhost.exe', 'openconsole.exe', 'winpty-agent.exe']

function isConsoleHelper(entry: ProcessEntry): boolean {
  return CONSOLE_HELPER_NAMES.includes(entry.name.toLowerCase())
}

export function listBackgroundProcesses(processTree: ProcessEntry[], shellPid: number): ProcessEntry[] {
  return processTree.filter((entry) => entry.pid !== shellPid && !isConsoleHelper(entry))
}

export interface RunningPrograms {
  program: string | null
  helpers: string[]
}

export function describeRunningPrograms(processes: ProcessEntry[], shellPid: number): RunningPrograms {
  const program = processes.filter((entry) => entry.parentPid === shellPid).map(friendlyProgramName).find((name) => name !== null) ?? null
  return { program, helpers: distinctProgramNames(processes, program) }
}
