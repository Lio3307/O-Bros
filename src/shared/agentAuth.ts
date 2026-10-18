import type { AgentLogin } from './agentLogins'

export type AgentNeeds = 'account' | 'api-key' | 'account-or-api-key'

export interface AgentAuthRule {
  command: string
  title: string
  needs: AgentNeeds
  keyVariables: string[]
  signIn: string
}

const NEEDS: AgentNeeds[] = ['account', 'api-key', 'account-or-api-key']

const REQUIREMENT_TEXT: Record<AgentNeeds, string> = {
  account: 'Needs an account sign-in',
  'api-key': 'Needs an API key',
  'account-or-api-key': 'Needs an account sign-in or an API key'
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

export function parseAgentAuthRules(raw: unknown): AgentAuthRule[] {
  if (!isRecord(raw) || !Array.isArray(raw.agents)) {
    return []
  }
  return raw.agents.flatMap((entry): AgentAuthRule[] => {
    if (
      !isRecord(entry) ||
      typeof entry.command !== 'string' ||
      typeof entry.title !== 'string' ||
      typeof entry.signIn !== 'string' ||
      !NEEDS.includes(entry.needs as AgentNeeds) ||
      !Array.isArray(entry.keyVariables)
    ) {
      return []
    }
    const keyVariables = entry.keyVariables.filter((name): name is string => typeof name === 'string')
    return [{ command: entry.command, title: entry.title, needs: entry.needs as AgentNeeds, keyVariables, signIn: entry.signIn }]
  })
}

export function requirementText(rule: AgentAuthRule): string {
  if (rule.keyVariables.length === 0) {
    return REQUIREMENT_TEXT[rule.needs]
  }
  return `${REQUIREMENT_TEXT[rule.needs]} (key variables: ${rule.keyVariables.join(', ')})`
}

export function loginWithRule(detected: AgentLogin | null, rule: AgentAuthRule, setVariables: string[]): AgentLogin {
  const base: AgentLogin = detected ?? {
    command: rule.command,
    title: rule.title,
    kind: 'unknown',
    summary: 'O-BROS cannot read how this agent signs in',
    providers: [],
    manageHint: rule.signIn
  }
  const usableVariables = rule.needs === 'account' ? [] : setVariables.filter((name) => rule.keyVariables.includes(name))
  const keyNote = `API key set in ${usableVariables.join(', ')}`
  const withRequirement = { ...base, requirement: requirementText(rule), manageHint: base.manageHint || rule.signIn }
  if (usableVariables.length === 0) {
    return withRequirement
  }
  if (base.kind === 'none' || base.kind === 'unknown') {
    return { ...withRequirement, kind: 'api-keys', summary: keyNote }
  }
  return { ...withRequirement, summary: `${base.summary} · ${keyNote}` }
}

export interface InstalledAgent {
  title: string
  commands: string[]
}

const OWN_SECTION_COMMANDS = ['claude', 'codex']

export function unlistedAgentLogins(agents: InstalledAgent[], rules: AgentAuthRule[], installed: Set<string>): AgentLogin[] {
  const handledCommands = new Set([...OWN_SECTION_COMMANDS, ...rules.map((rule) => rule.command)])
  const logins = new Map<string, AgentLogin>()
  for (const agent of agents) {
    const command = agent.commands.find((candidate) => installed.has(candidate.toLowerCase()))
    if (command === undefined || logins.has(command) || agent.commands.some((candidate) => handledCommands.has(candidate))) {
      continue
    }
    logins.set(command, {
      command,
      title: agent.title,
      kind: 'unknown',
      summary: 'O-BROS has no sign-in details for this agent yet',
      providers: [],
      manageHint: `Run ${command} and follow its setup, if it asks for an account or a key.`
    })
  }
  return Array.from(logins.values())
}
