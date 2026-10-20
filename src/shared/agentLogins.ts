import { isRecord } from './isRecord'
export type AgentLoginKind = 'account' | 'api-keys' | 'none' | 'unknown'

export interface AgentLogin {
  command: string
  title: string
  kind: AgentLoginKind
  summary: string
  providers: string[]
  manageHint: string
  requirement?: string
}

const KNOWN_PROVIDER_NAMES: Record<string, string> = {
  anthropic: 'Anthropic',
  openai: 'OpenAI',
  google: 'Google',
  openrouter: 'OpenRouter',
  nvidia: 'NVIDIA',
  opencode: 'OpenCode Zen',
  'cloudflare-workers-ai': 'Cloudflare Workers AI',
  'github-copilot': 'GitHub Copilot',
  groq: 'Groq',
  xai: 'xAI',
  deepseek: 'DeepSeek',
  mistral: 'Mistral',
  kilo: 'Kilo account',
  cline: 'Cline account',
  'cline-pass': 'Cline Pass'
}

const OAUTH_TYPES = ['oauth', 'wellknown']

export function providerDisplayName(id: string): string {
  const known = KNOWN_PROVIDER_NAMES[id.toLowerCase()]
  if (known !== undefined) {
    return known
  }
  return id
    .split('-')
    .filter((word) => word !== '')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
}

function plural(count: number, singular: string, pluralWord: string): string {
  return `${count} ${count === 1 ? singular : pluralWord}`
}

export function loginFromAuthFile(raw: unknown, command: string, title: string, manageHint: string): AgentLogin {
  const entries = isRecord(raw) ? Object.entries(raw).filter(([, value]) => isRecord(value)) : []
  const providers = entries.map(([id]) => providerDisplayName(id))
  const hasAccount = entries.some(([, value]) => OAUTH_TYPES.includes(String((value as Record<string, unknown>).type)))
  if (entries.length === 0) {
    return { command, title, kind: 'none', summary: 'Not signed in', providers: [], manageHint }
  }
  return {
    command,
    title,
    kind: hasAccount ? 'account' : 'api-keys',
    summary: `${plural(entries.length, 'provider', 'providers')} connected`,
    providers,
    manageHint
  }
}

const GEMINI_HINT = 'Run gemini and type /auth to change how it signs in.'

export function geminiLogin(accounts: unknown, settings: unknown): AgentLogin {
  const base = { command: 'gemini', title: 'Gemini CLI', providers: [], manageHint: GEMINI_HINT }
  const security = isRecord(settings) && isRecord(settings.security) ? settings.security : null
  const auth = security !== null && isRecord(security.auth) ? security.auth : null
  const selectedType = typeof auth?.selectedType === 'string' ? auth.selectedType : isRecord(settings) ? settings.selectedAuthType : null
  const activeEmail = isRecord(accounts) && typeof accounts.active === 'string' ? accounts.active : null
  if (selectedType === 'gemini-api-key') {
    return { ...base, kind: 'api-keys', summary: 'Gemini API key (pay-per-use)' }
  }
  if (selectedType === 'vertex-ai') {
    return { ...base, kind: 'api-keys', summary: 'Vertex AI (Google Cloud)' }
  }
  if (activeEmail !== null) {
    return { ...base, kind: 'account', summary: `Google account ${activeEmail}` }
  }
  return { ...base, kind: 'none', summary: 'Not signed in' }
}

const CLINE_HINT = 'Run cline auth to sign in or change the provider.'

export function clineLogin(raw: unknown): AgentLogin {
  const base = { command: 'cline', title: 'Cline', manageHint: CLINE_HINT }
  const providers = isRecord(raw) && isRecord(raw.providers) ? Object.keys(raw.providers) : []
  if (providers.length === 0) {
    return { ...base, kind: 'none', summary: 'Not signed in', providers: [] }
  }
  const lastUsed = isRecord(raw) && typeof raw.lastUsedProvider === 'string' ? raw.lastUsedProvider : providers[0]
  const usesAccount = lastUsed.toLowerCase().startsWith('cline')
  return {
    ...base,
    kind: usesAccount ? 'account' : 'api-keys',
    summary: `Uses ${providerDisplayName(lastUsed)}`,
    providers: providers.map(providerDisplayName)
  }
}

const COPILOT_HINT = 'Run copilot and type /login to sign in with GitHub.'

function withoutCommentLines(text: string): string {
  return text
    .split('\n')
    .filter((line) => !line.trim().startsWith('//'))
    .join('\n')
}

export function copilotLogin(configText: string | null): AgentLogin {
  const base = { command: 'copilot', title: 'GitHub Copilot CLI', providers: [], manageHint: COPILOT_HINT }
  let config: unknown = null
  try {
    config = configText === null ? null : JSON.parse(withoutCommentLines(configText))
  } catch {
    config = null
  }
  const users = isRecord(config) && Array.isArray(config.logged_in_users) ? config.logged_in_users.filter(isRecord) : []
  const lastUser = isRecord(config) && isRecord(config.last_logged_in_user) ? config.last_logged_in_user : users[0]
  if (lastUser === undefined || typeof lastUser.login !== 'string') {
    return { ...base, kind: 'none', summary: 'Not signed in' }
  }
  return { ...base, kind: 'account', summary: `GitHub account ${lastUser.login}` }
}
