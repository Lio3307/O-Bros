import { readProcessTable, type ProcessEntry } from '../resources/processTable'
import { terminalPidOf } from '../ptyManager'
import { terminalFactsOf } from '../terminalFacts'
import type { AgentCatalog } from './agentCatalog'
import { isTeamMember } from './teamRegistry'

const MAX_ANCESTORS = 40
const EXECUTABLE_TOKENS = 2
const PROGRAM_SUFFIXES = ['', '-cli', '-code']
const FILE_EXTENSIONS = ['.exe', '.cmd', '.bat', '.ps1', '.js', '.mjs', '.cjs']
const SEGMENT_SEPARATORS = ['\\', '/']

function withoutExtension(segment: string): string {
  const extension = FILE_EXTENSIONS.find((candidate) => segment.endsWith(candidate))
  return extension === undefined ? segment : segment.slice(0, segment.length - extension.length)
}

function pathSegments(text: string): string[] {
  let segments = [text.toLowerCase().split('"').join('').split("'").join('')]
  for (const separator of SEGMENT_SEPARATORS) {
    segments = segments.flatMap((segment) => segment.split(separator))
  }
  return segments.map(withoutExtension).filter((segment) => segment !== '')
}

function leadingArguments(commandLine: string, count: number): string[] {
  const found: string[] = []
  let current = ''
  let isQuoted = false
  for (const character of commandLine.trim()) {
    if (character === '"') {
      isQuoted = !isQuoted
      continue
    }
    if (character === ' ' && !isQuoted) {
      if (current !== '') {
        found.push(current)
      }
      current = ''
      if (found.length === count) {
        return found
      }
      continue
    }
    current += character
  }
  return current === '' ? found : [...found, current].slice(0, count)
}

function executableParts(entry: ProcessEntry): string[] {
  return [entry.name, ...leadingArguments(entry.commandLine, EXECUTABLE_TOKENS)].flatMap(pathSegments)
}

export function agentProgramOf(entry: ProcessEntry, programs: string[]): string | null {
  const parts = executableParts(entry)
  return programs.find((program) => PROGRAM_SUFFIXES.some((suffix) => parts.includes(program + suffix))) ?? null
}

export function isAgentProcess(entry: ProcessEntry, programs: string[]): boolean {
  return agentProgramOf(entry, programs) !== null
}

export function agentAncestorOf(
  table: ProcessEntry[],
  startPid: number,
  stopPid: number | null,
  programs: string[]
): ProcessEntry | null {
  const byPid = new Map(table.map((entry) => [entry.pid, entry]))
  let current = byPid.get(startPid)
  let steps = 0
  while (current !== undefined && current.pid !== stopPid && steps < MAX_ANCESTORS) {
    if (current.pid !== startPid && isAgentProcess(current, programs)) {
      return current
    }
    current = current.parentPid === current.pid ? undefined : byPid.get(current.parentPid)
    steps += 1
  }
  return null
}

export interface AgentCaller {
  command: string | null
}

export async function findAgentCaller(paneId: string, guardPid: number | null, catalog: AgentCatalog): Promise<AgentCaller | null> {
  const knownCommand = terminalFactsOf(paneId)?.agentCommand ?? null
  if (knownCommand !== null) {
    return { command: knownCommand }
  }
  if (isTeamMember(paneId)) {
    return { command: null }
  }
  if (guardPid === null) {
    return null
  }
  const table = await readProcessTable()
  const ancestor = agentAncestorOf(table, guardPid, terminalPidOf(paneId), catalog.programs)
  return ancestor === null ? null : { command: agentProgramOf(ancestor, catalog.programs) }
}
