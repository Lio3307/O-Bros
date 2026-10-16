import { homedir } from 'node:os'
import { join } from 'node:path'
import type { UsageFacts } from '../../../shared/usageSupport'
import { scanAccounts } from '../accountScanner'
import { readJsonIfExists } from '../fileSystem'
import { findOpenRouterKeySource } from './creditBalances'

const CODEX_PLAN_CLAIM = 'https://api.openai.com/auth'

interface ClaudeCredentialsFile {
  claudeAiOauth?: { accessToken?: string; subscriptionType?: string | null }
}

interface CodexAuthFile {
  auth_mode?: string
  OPENAI_API_KEY?: string | null
  tokens?: { id_token?: string; access_token?: string } | null
}

interface GeminiSettingsFile {
  selectedAuthType?: string
  security?: { auth?: { selectedType?: string } }
}

async function defaultConfigDir(provider: 'claude' | 'codex'): Promise<string | null> {
  const accounts = await scanAccounts()
  return accounts.find((account) => account.provider === provider && account.isSystemDefault)?.configDir ?? null
}

function planFromIdToken(idToken: string | undefined): string | null {
  const payload = idToken?.split('.')[1]
  if (payload === undefined) {
    return null
  }
  try {
    const claims = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as Record<string, unknown>
    const auth = claims[CODEX_PLAN_CLAIM] as { chatgpt_plan_type?: unknown } | undefined
    return typeof auth?.chatgpt_plan_type === 'string' ? auth.chatgpt_plan_type : null
  } catch {
    return null
  }
}

async function claudeFacts(): Promise<Pick<UsageFacts, 'claudeHasLoginFile' | 'claudePlan'>> {
  const configDir = await defaultConfigDir('claude')
  const credentials = configDir === null ? null : await readJsonIfExists<ClaudeCredentialsFile>(join(configDir, '.credentials.json'))
  const oauth = credentials?.claudeAiOauth
  return {
    claudeHasLoginFile: typeof oauth?.accessToken === 'string',
    claudePlan: typeof oauth?.subscriptionType === 'string' ? oauth.subscriptionType.toLowerCase() : null
  }
}

async function codexFacts(): Promise<Pick<UsageFacts, 'codexLoginMode' | 'codexPlan'>> {
  const configDir = await defaultConfigDir('codex')
  const auth = configDir === null ? null : await readJsonIfExists<CodexAuthFile>(join(configDir, 'auth.json'))
  if (auth === null) {
    return { codexLoginMode: null, codexPlan: null }
  }
  if (typeof auth.tokens?.access_token === 'string') {
    return { codexLoginMode: 'chatgpt', codexPlan: planFromIdToken(auth.tokens.id_token) }
  }
  const hasKey = typeof auth.OPENAI_API_KEY === 'string' && auth.OPENAI_API_KEY !== ''
  return { codexLoginMode: hasKey ? 'api-key' : null, codexPlan: null }
}

async function geminiAuthType(): Promise<string | null> {
  const settings = await readJsonIfExists<GeminiSettingsFile>(join(homedir(), '.gemini', 'settings.json'))
  return settings?.security?.auth?.selectedType ?? settings?.selectedAuthType ?? null
}

export async function readUsageFacts(): Promise<UsageFacts> {
  const [claude, codex, gemini, openRouterVia] = await Promise.all([
    claudeFacts(),
    codexFacts(),
    geminiAuthType(),
    findOpenRouterKeySource()
  ])
  return { ...claude, ...codex, geminiAuthType: gemini, openRouterVia }
}
