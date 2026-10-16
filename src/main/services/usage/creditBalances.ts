import { homedir } from 'node:os'
import { join } from 'node:path'
import { parseOpenRouterKey, type CreditBalance } from '../../../shared/creditBalance'
import { readJsonIfExists } from '../fileSystem'
import { fetchJson } from './providerRequest'

const OPENROUTER_KEY_URL = 'https://openrouter.ai/api/v1/key'
const OPENROUTER_ENVIRONMENT_VARIABLE = 'OPENROUTER_API_KEY'

interface OpenCodeAuthEntry {
  type?: string
  key?: string
}

interface FoundKey {
  key: string
  viaTool: string
}

function openCodeAuthPath(): string {
  const dataHome = process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')
  return join(dataHome, 'opencode', 'auth.json')
}

async function findOpenRouterKey(): Promise<FoundKey | null> {
  const auth = await readJsonIfExists<Record<string, OpenCodeAuthEntry>>(openCodeAuthPath())
  const fromOpenCode = auth?.openrouter
  if (fromOpenCode?.type === 'api' && typeof fromOpenCode.key === 'string' && fromOpenCode.key !== '') {
    return { key: fromOpenCode.key, viaTool: 'OpenCode' }
  }
  const fromEnvironment = process.env[OPENROUTER_ENVIRONMENT_VARIABLE]
  return fromEnvironment === undefined || fromEnvironment === '' ? null : { key: fromEnvironment, viaTool: OPENROUTER_ENVIRONMENT_VARIABLE }
}

export async function findOpenRouterKeySource(): Promise<string | null> {
  return (await findOpenRouterKey())?.viaTool ?? null
}

async function readOpenRouter(): Promise<CreditBalance | null> {
  const found = await findOpenRouterKey()
  if (found === null) {
    return null
  }
  const base = { id: 'openrouter', name: 'OpenRouter', viaTool: found.viaTool, logoCommand: 'openrouter' }
  try {
    const numbers = parseOpenRouterKey(await fetchJson<unknown>(OPENROUTER_KEY_URL, { Authorization: `Bearer ${found.key}` }))
    if (numbers === null) {
      throw new Error('OpenRouter sent an answer O-BROS could not read.')
    }
    return { ...base, ...numbers, errorMessage: null }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read the OpenRouter usage.'
    return { ...base, spentDollars: 0, limitDollars: null, remainingDollars: null, isFreeTier: false, errorMessage: message }
  }
}

export async function readCreditBalances(): Promise<CreditBalance[]> {
  const openRouter = await readOpenRouter()
  return openRouter === null ? [] : [openRouter]
}
