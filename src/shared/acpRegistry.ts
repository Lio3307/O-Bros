export type CommandAliases = Record<string, string>

export interface AcpAgent {
  id: string
  name: string
  description: string
  commands: string[]
  iconUrl: string | null
}

export interface AgentSuggestion {
  name: string
  command: string
}


const GENERIC_NAMES = ['cli', 'code', 'agent', 'server', 'app']
const ACP_SUFFIX = '-acp'
const CLI_SUFFIX = '-cli'

type JsonRecord = Record<string, unknown>

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function withoutSuffix(text: string, suffix: string): string {
  return text.endsWith(suffix) ? text.slice(0, text.length - suffix.length) : text
}

export function packageCommandName(packageSpec: string): string {
  const versionStarts = [packageSpec.indexOf('@', 1), packageSpec.indexOf('=')].filter((index) => index > 0)
  const withoutVersion = versionStarts.length > 0 ? packageSpec.slice(0, Math.min(...versionStarts)) : packageSpec
  return withoutVersion.slice(withoutVersion.lastIndexOf('/') + 1)
}

export function binaryCommandName(cmd: string): string {
  const slashed = cmd.split('\\').join('/')
  const fileName = slashed.slice(slashed.lastIndexOf('/') + 1)
  const dotIndex = fileName.indexOf('.')
  return dotIndex > 0 ? fileName.slice(0, dotIndex) : fileName
}

function distributionNames(distribution: unknown): string[] {
  if (!isRecord(distribution)) {
    return []
  }
  const names: string[] = []
  for (const kind of ['npx', 'uvx']) {
    const entry = distribution[kind]
    if (isRecord(entry) && typeof entry.package === 'string') {
      names.push(packageCommandName(entry.package))
    }
  }
  if (isRecord(distribution.binary)) {
    for (const target of Object.values(distribution.binary)) {
      if (isRecord(target) && typeof target.cmd === 'string') {
        names.push(binaryCommandName(target.cmd))
      }
    }
  }
  return names
}

export function candidateCommands(id: string, distribution: unknown, aliases: CommandAliases = {}): string[] {
  const alias = aliases[id]
  if (alias !== undefined) {
    return [alias]
  }
  const names = [id, withoutSuffix(id, ACP_SUFFIX), ...distributionNames(distribution)]
  const withoutCliSuffix = names.map((name) => withoutSuffix(name, CLI_SUFFIX))
  return Array.from(new Set([...names, ...withoutCliSuffix])).filter(
    (name) => name !== '' && !GENERIC_NAMES.includes(name)
  )
}

export function parseCommandAliases(raw: unknown): CommandAliases {
  if (!isRecord(raw) || !isRecord(raw.commandByRegistryId)) {
    return {}
  }
  const aliases: CommandAliases = {}
  for (const [id, command] of Object.entries(raw.commandByRegistryId)) {
    if (typeof command === 'string' && command.trim() !== '') {
      aliases[id] = command.trim()
    }
  }
  return aliases
}

function textOf(value: unknown): string {
  return typeof value === 'string' ? value : ''
}

export function parseAcpRegistry(raw: unknown, aliases: CommandAliases = {}): AcpAgent[] {
  if (!isRecord(raw) || !Array.isArray(raw.agents)) {
    return []
  }
  const agents: AcpAgent[] = []
  for (const entry of raw.agents) {
    if (isRecord(entry) && typeof entry.id === 'string' && typeof entry.name === 'string') {
      const iconUrl = textOf(entry.icon)
      agents.push({
        id: entry.id,
        name: entry.name,
        description: textOf(entry.description),
        commands: candidateCommands(entry.id, entry.distribution, aliases),
        iconUrl: iconUrl === '' ? null : iconUrl
      })
    }
  }
  return agents
}

export function buildAgentSuggestions(
  registryAgents: AcpAgent[],
  installedCommands: string[],
  addedCommands: string[]
): AgentSuggestion[] {
  const installed = new Set(installedCommands)
  const added = new Set(addedCommands)
  const suggestions = new Map<string, AgentSuggestion>()
  for (const entry of registryAgents) {
    const command = entry.commands.find((candidate) => installed.has(candidate))
    if (command !== undefined && !added.has(command) && !suggestions.has(command)) {
      suggestions.set(command, { name: entry.name, command })
    }
  }
  return Array.from(suggestions.values())
}
