import type { AcpAgent } from './acpRegistry'
import { programOf, shortAgentName, type AgentLauncher } from './agentLaunchers'

export interface TeamAgentOption {
  name: string
  command: string
  isInstalled: boolean
}

export type TeamAgentMatch =
  | { kind: 'found'; agent: TeamAgentOption }
  | { kind: 'not-installed'; agent: TeamAgentOption }
  | { kind: 'unknown' }

interface CatalogEntry {
  name: string
  commands: string[]
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function isCustomPath(program: string): boolean {
  return program.includes('/') || program.includes('\\')
}

function isInstalled(command: string, installedCommands: string[]): boolean {
  const program = programOf(command)
  return isCustomPath(program) || installedCommands.includes(program.toLowerCase())
}

function catalogOf(registryAgents: AcpAgent[]): CatalogEntry[] {
  return registryAgents.filter((agent) => agent.commands.length > 0)
}

export function listTeamAgents(
  launchers: AgentLauncher[],
  registryAgents: AcpAgent[],
  installedCommands: string[]
): TeamAgentOption[] {
  const options: TeamAgentOption[] = launchers
    .filter((launcher) => launcher.name.trim() !== '' && launcher.command.trim() !== '')
    .map((launcher) => ({
      name: launcher.name.trim(),
      command: launcher.command.trim(),
      isInstalled: isInstalled(launcher.command, installedCommands)
    }))
  const coveredPrograms = new Set(options.map((option) => normalize(programOf(option.command))))

  for (const entry of catalogOf(registryAgents)) {
    if (entry.commands.some((command) => coveredPrograms.has(normalize(command)))) {
      continue
    }
    const installedCommand = entry.commands.find((command) => installedCommands.includes(normalize(command)))
    options.push({
      name: entry.name,
      command: installedCommand ?? entry.commands[0],
      isInstalled: installedCommand !== undefined
    })
    entry.commands.forEach((command) => coveredPrograms.add(normalize(command)))
  }
  return options
}

function namesOf(option: TeamAgentOption): string[] {
  return [normalize(option.name), normalize(shortAgentName(option.name)), normalize(programOf(option.command))]
}

export function findTeamAgent(query: string, options: TeamAgentOption[]): TeamAgentMatch {
  const wanted = normalize(query)
  const matches = options.filter((option) => namesOf(option).includes(wanted))
  const installed = matches.find((option) => option.isInstalled)
  if (installed !== undefined) {
    return { kind: 'found', agent: installed }
  }
  return matches.length > 0 ? { kind: 'not-installed', agent: matches[0] } : { kind: 'unknown' }
}
