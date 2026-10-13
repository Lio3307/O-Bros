import type { ProcessEntry } from './processTable'

const CONSOLE_HELPER_NAMES = ['conhost.exe', 'openconsole.exe', 'winpty-agent.exe']
const MAX_COMMAND_LENGTH = 90

function isConsoleHelper(entry: ProcessEntry): boolean {
  return CONSOLE_HELPER_NAMES.includes(entry.name.toLowerCase())
}

function shorten(text: string): string {
  const singleLine = text.split('\n').join(' ').trim()
  return singleLine.length > MAX_COMMAND_LENGTH ? `${singleLine.slice(0, MAX_COMMAND_LENGTH)}...` : singleLine
}

export function listBackgroundProcesses(processTree: ProcessEntry[], shellPid: number): ProcessEntry[] {
  return processTree.filter((entry) => entry.pid !== shellPid && !isConsoleHelper(entry))
}

export function describeBackgroundCommands(processes: ProcessEntry[]): string[] {
  const commands = processes.map((entry) => shorten(entry.commandLine === '' ? entry.name : entry.commandLine))
  return Array.from(new Set(commands.filter((command) => command !== '')))
}
