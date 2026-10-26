import { parseClinePassLimits, parseGrokBilling, type PlanReading, type PlanUsage, type PlanUsageId } from '../../../shared/planUsage'
import { findClineLogin, findGrokLogin, type SavedLogin } from './planLogins'
import { fetchJson } from './providerRequest'

const GROK_BILLING_URL = 'https://cli-chat-proxy.grok.com/v1/billing?format=credits'
const CLINEPASS_LIMITS_URL = 'https://api.cline.bot/api/v1/users/me/plan/usage-limits'

interface PlanSource {
  id: PlanUsageId
  name: string
  logoCommand: string
  renewHint: string
  findLogin: () => Promise<SavedLogin | null>
  read: (token: string) => Promise<PlanReading | null>
  hidesWithoutWindows: boolean
}

async function readGrok(token: string): Promise<PlanReading | null> {
  return parseGrokBilling(
    await fetchJson<unknown>(GROK_BILLING_URL, { Authorization: `Bearer ${token}`, 'x-xai-token-auth': 'xai-grok-cli', Accept: 'application/json' })
  )
}

async function readClinePass(token: string): Promise<PlanReading | null> {
  const windows = parseClinePassLimits(await fetchJson<unknown>(CLINEPASS_LIMITS_URL, { Authorization: `Bearer ${token}` }))
  return windows === null ? null : { plan: 'ClinePass', windows }
}

const PLAN_SOURCES: PlanSource[] = [
  {
    id: 'grok',
    name: 'Grok',
    logoCommand: 'grok',
    renewHint: 'Run grok login again',
    findLogin: findGrokLogin,
    read: readGrok,
    hidesWithoutWindows: false
  },
  {
    id: 'clinepass',
    name: 'ClinePass',
    logoCommand: 'cline',
    renewHint: 'Open cline once so it renews the sign-in',
    findLogin: findClineLogin,
    read: readClinePass,
    hidesWithoutWindows: true
  }
]

async function readSource(source: PlanSource, login: SavedLogin): Promise<PlanUsage | null> {
  const base = { id: source.id, name: source.name, logoCommand: source.logoCommand, plan: null, windows: [] }
  if (login.expiresAt !== null && login.expiresAt <= Date.now()) {
    return { ...base, errorMessage: `The ${source.name} sign-in has expired. ${source.renewHint}, then Rescan.` }
  }
  try {
    const reading = await source.read(login.token)
    if (reading === null) {
      return { ...base, errorMessage: `${source.name} sent an answer O-BROS could not read.` }
    }
    if (reading.windows.length === 0 && source.hidesWithoutWindows) {
      return null
    }
    return { ...base, plan: reading.plan, windows: reading.windows, errorMessage: null }
  } catch (error) {
    return { ...base, errorMessage: error instanceof Error ? error.message : `Could not read the ${source.name} usage.` }
  }
}

export async function readPlanUsages(): Promise<PlanUsage[]> {
  const usages = await Promise.all(
    PLAN_SOURCES.map(async (source) => {
      const login = await source.findLogin()
      return login === null ? null : readSource(source, login)
    })
  )
  return usages.filter((usage): usage is PlanUsage => usage !== null)
}
