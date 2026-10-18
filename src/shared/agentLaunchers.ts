import type { AcpAgent } from './acpRegistry'
import type { ProviderId } from './types'

export interface AgentLauncher {
  id: string
  name: string
  command: string
  providerId?: string | null
}

export const DEFAULT_AGENT_LAUNCHERS: AgentLauncher[] = []

export const MAX_SHOWN_AGENTS = 2

export function toggleShownId(shownIds: string[], id: string): string[] {
  if (shownIds.includes(id)) {
    return shownIds.filter((shownId) => shownId !== id)
  }
  return shownIds.length < MAX_SHOWN_AGENTS ? [...shownIds, id] : shownIds
}

export function shownLaunchers(launchers: AgentLauncher[], shownIds: string[]): AgentLauncher[] {
  return shownIds
    .map((id) => launchers.find((launcher) => launcher.id === id))
    .filter((launcher): launcher is AgentLauncher => launcher !== undefined && isUsableLauncher(launcher.name, launcher.command))
    .slice(0, MAX_SHOWN_AGENTS)
}

export function parseShownIds(raw: string | null, launchers: AgentLauncher[]): string[] {
  try {
    const parsed: unknown = raw === null ? null : JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return []
    }
    const knownIds = parsed.filter((id): id is string => launchers.some((launcher) => launcher.id === id))
    return knownIds.slice(0, MAX_SHOWN_AGENTS)
  } catch {
    return []
  }
}

const REDUNDANT_NAME_ENDINGS = [' Agent', ' CLI']

export function shortAgentName(name: string): string {
  const trimmed = name.trim()
  const ending = REDUNDANT_NAME_ENDINGS.find((candidate) => trimmed.endsWith(candidate))
  if (ending === undefined || trimmed.length === ending.length) {
    return trimmed
  }
  return trimmed.slice(0, trimmed.length - ending.length)
}

export function programOf(command: string): string {
  return command.trim().split(' ')[0]
}

export function isAgentCommand(command: string | null, launchers: AgentLauncher[], registry: AcpAgent[]): boolean {
  if (command === null || command.trim() === '') {
    return false
  }
  const program = programOf(command).toLowerCase()
  const launcherPrograms = launchers.map((launcher) => programOf(launcher.command).toLowerCase())
  return launcherPrograms.includes(program) || registry.some((agent) => agent.commands.includes(program))
}

export function providerOfCommand(command: string): ProviderId | null {
  const program = programOf(command)
  return program === 'claude' || program === 'codex' ? program : null
}

export type AgentStatus = 'checking' | 'connected' | 'signed-in' | 'signed-out' | 'missing' | 'custom-path'

export function agentStatusOf(
  command: string,
  installedCommands: string[] | null,
  hasLogin: boolean | null = null
): AgentStatus {
  if (installedCommands === null) {
    return 'checking'
  }
  const program = programOf(command)
  if (program.includes('/') || program.includes('\\')) {
    return 'custom-path'
  }
  if (!installedCommands.includes(program.toLowerCase())) {
    return 'missing'
  }
  if (providerOfCommand(command) === null || hasLogin === null) {
    return 'connected'
  }
  return hasLogin ? 'signed-in' : 'signed-out'
}

export function isUsableLauncher(name: string, command: string): boolean {
  return name.trim() !== '' && command.trim() !== ''
}

function isLauncher(value: unknown): value is AgentLauncher {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return (
    typeof candidate.id === 'string' &&
    typeof candidate.name === 'string' &&
    typeof candidate.command === 'string' &&
    (candidate.providerId === undefined || candidate.providerId === null || typeof candidate.providerId === 'string')
  )
}

export function providerIdForCommand(launchers: AgentLauncher[], command: string | null): string | null {
  if (command === null) {
    return null
  }
  const started = command.trim()
  const matches = launchers.filter((launcher) => {
    const launcherCommand = launcher.command.trim()
    return launcherCommand !== '' && (started === launcherCommand || started.startsWith(`${launcherCommand} `))
  })
  const closest = matches.sort((first, second) => second.command.trim().length - first.command.trim().length)[0]
  return closest?.providerId ?? null
}

export function parseAgentLaunchers(raw: string | null): AgentLauncher[] | null {
  if (raw === null) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    return parsed.filter(isLauncher).filter((launcher) => isUsableLauncher(launcher.name, launcher.command))
  } catch {
    return null
  }
}
