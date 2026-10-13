import type { ProviderId } from './types'

export interface AgentLauncher {
  id: string
  name: string
  command: string
}

export interface KnownAgent {
  name: string
  command: string
}

export const KNOWN_AGENTS: KnownAgent[] = [
  { name: 'Claude', command: 'claude' },
  { name: 'Codex', command: 'codex' },
  { name: 'OpenCode', command: 'opencode' },
  { name: 'Gemini', command: 'gemini' },
  { name: 'Aider', command: 'aider' },
  { name: 'Amp', command: 'amp' },
  { name: 'Goose', command: 'goose' },
  { name: 'Qwen Code', command: 'qwen' },
  { name: 'Cursor Agent', command: 'cursor-agent' },
  { name: 'Copilot', command: 'copilot' },
  { name: 'Cline', command: 'cline' },
  { name: 'Kimi', command: 'kimi' },
  { name: 'Grok', command: 'grok' },
  { name: 'Junie', command: 'junie' },
  { name: 'OpenHands', command: 'openhands' },
  { name: 'Kiro', command: 'kiro-cli' },
  { name: 'Qoder', command: 'qodercli' },
  { name: 'CodeBuddy', command: 'codebuddy' },
  { name: 'Droid', command: 'droid' },
  { name: 'Crush', command: 'crush' },
  { name: 'Auggie', command: 'auggie' },
  { name: 'Devin', command: 'devin' },
  { name: 'Mistral Vibe', command: 'vibe' },
  { name: 'Ollama', command: 'ollama' }
]

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

export function programOf(command: string): string {
  return command.trim().split(' ')[0]
}

export function providerOfCommand(command: string): ProviderId | null {
  const program = programOf(command)
  return program === 'claude' || program === 'codex' ? program : null
}

export function isUsableLauncher(name: string, command: string): boolean {
  return name.trim() !== '' && command.trim() !== ''
}

function isLauncher(value: unknown): value is AgentLauncher {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.name === 'string' && typeof candidate.command === 'string'
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
