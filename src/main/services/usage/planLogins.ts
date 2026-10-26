import { homedir } from 'node:os'
import { join } from 'node:path'
import { isRecord } from '../../../shared/isRecord'
import { readJsonIfExists } from '../fileSystem'

const GROK_OIDC_SCOPE_PREFIX = 'https://auth.x.ai::'
const GROK_SESSION_SCOPE_PART = '/sign-in'
const CLINE_TOKEN_PREFIX = 'workos:'
const CLINE_PROVIDER_KEYS = ['cline', 'cline-pass']
const MILLISECONDS_FROM = 1e12

export interface SavedLogin {
  token: string
  expiresAt: number | null
}

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value.trim() !== '' ? value.trim() : null
}

function timeOf(value: unknown): number | null {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value >= MILLISECONDS_FROM ? value : value * 1000
  }
  const parsed = typeof value === 'string' ? Date.parse(value) : NaN
  return Number.isFinite(parsed) ? parsed : null
}

function grokEntryLogin(entry: unknown): SavedLogin | null {
  if (!isRecord(entry)) {
    return null
  }
  const token = textOf(entry.key)
  return token === null ? null : { token, expiresAt: timeOf(entry.expires_at) }
}

export function grokLoginOf(raw: unknown): SavedLogin | null {
  if (!isRecord(raw)) {
    return null
  }
  const scopes = Object.keys(raw)
  const oidc = scopes.filter((scope) => scope.startsWith(GROK_OIDC_SCOPE_PREFIX)).map((scope) => grokEntryLogin(raw[scope]))
  const session = scopes.filter((scope) => scope.includes(GROK_SESSION_SCOPE_PART)).map((scope) => grokEntryLogin(raw[scope]))
  return [...oidc, ...session].find((login) => login !== null) ?? null
}

function clineSettingsLogin(provider: unknown): SavedLogin | null {
  const settings = isRecord(provider) && isRecord(provider.settings) ? provider.settings : null
  if (settings === null) {
    return null
  }
  const auth = isRecord(settings.auth) ? settings.auth : {}
  const accessToken = textOf(auth.accessToken)
  if (accessToken !== null) {
    return { token: accessToken.startsWith(CLINE_TOKEN_PREFIX) ? accessToken : CLINE_TOKEN_PREFIX + accessToken, expiresAt: timeOf(auth.expiresAt) }
  }
  const apiKey = textOf(settings.apiKey) ?? textOf(auth.apiKey)
  return apiKey === null ? null : { token: apiKey, expiresAt: null }
}

export function clineLoginOf(raw: unknown): SavedLogin | null {
  const providers = isRecord(raw) && isRecord(raw.providers) ? raw.providers : null
  if (providers === null) {
    return null
  }
  const logins = CLINE_PROVIDER_KEYS.map((key) => clineSettingsLogin(providers[key])).filter((login) => login !== null)
  return logins.reduce<SavedLogin | null>((freshest, login) => (freshest === null || (login.expiresAt ?? 0) > (freshest.expiresAt ?? 0) ? login : freshest), null)
}

function grokAuthPath(): string {
  return join(process.env.GROK_HOME ?? join(homedir(), '.grok'), 'auth.json')
}

function clineProvidersPath(): string {
  if (process.env.CLINE_PROVIDER_SETTINGS_PATH !== undefined) {
    return process.env.CLINE_PROVIDER_SETTINGS_PATH
  }
  const dataFolder = process.env.CLINE_DATA_DIR ?? join(process.env.CLINE_DIR ?? join(homedir(), '.cline'), 'data')
  return join(dataFolder, 'settings', 'providers.json')
}

export async function findGrokLogin(): Promise<SavedLogin | null> {
  return grokLoginOf(await readJsonIfExists<unknown>(grokAuthPath()))
}

export async function findClineLogin(): Promise<SavedLogin | null> {
  return clineLoginOf(await readJsonIfExists<unknown>(clineProvidersPath()))
}
