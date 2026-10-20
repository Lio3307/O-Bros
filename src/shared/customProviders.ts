import { isRecord } from './isRecord'
export type ProviderProtocol = 'anthropic' | 'openai'

export interface CustomProvider {
  id: string
  name: string
  protocol: ProviderProtocol
  baseUrl: string
  modelId: string
  contextTokens: number | null
  outputTokens: number | null
}

export type CustomProviderDraft = Omit<CustomProvider, 'id'>

const PROTOCOLS: ProviderProtocol[] = ['anthropic', 'openai']
const WEB_PROTOCOLS = ['http:', 'https:']
const KEY_HINT_LENGTH = 4

function tokensOf(value: unknown): number | null {
  return typeof value === 'number' && Number.isInteger(value) && value > 0 ? value : null
}

export function parseCustomProviders(raw: unknown): CustomProvider[] {
  if (!Array.isArray(raw)) {
    return []
  }
  return raw.flatMap((entry): CustomProvider[] => {
    if (
      !isRecord(entry) ||
      typeof entry.id !== 'string' ||
      typeof entry.name !== 'string' ||
      typeof entry.baseUrl !== 'string' ||
      typeof entry.modelId !== 'string' ||
      !PROTOCOLS.includes(entry.protocol as ProviderProtocol)
    ) {
      return []
    }
    return [
      {
        id: entry.id,
        name: entry.name,
        protocol: entry.protocol as ProviderProtocol,
        baseUrl: entry.baseUrl,
        modelId: entry.modelId,
        contextTokens: tokensOf(entry.contextTokens),
        outputTokens: tokensOf(entry.outputTokens)
      }
    ]
  })
}

export function isWebAddress(text: string): boolean {
  try {
    return WEB_PROTOCOLS.includes(new URL(text.trim()).protocol)
  } catch {
    return false
  }
}

export function parseTokenCount(text: string): number | null {
  const trimmed = text.trim().split(',').join('').split('_').join('')
  if (trimmed === '') {
    return null
  }
  const count = Number(trimmed)
  return Number.isInteger(count) && count > 0 ? count : null
}

export function draftProblem(draft: CustomProviderDraft): string | null {
  if (draft.name.trim() === '') {
    return 'Give the provider a name.'
  }
  if (!isWebAddress(draft.baseUrl)) {
    return 'The URL must start with https:// or http://.'
  }
  if (draft.modelId.trim() === '') {
    return 'Enter the model ID the provider expects, for example claude-sonnet-4-5 or gpt-4.1.'
  }
  return null
}

export function keyHintOf(apiKey: string): string {
  const trimmed = apiKey.trim()
  return trimmed.length <= KEY_HINT_LENGTH ? '' : trimmed.slice(-KEY_HINT_LENGTH)
}

export function providerEnvironment(provider: CustomProvider, apiKey: string | null): Record<string, string> {
  const baseUrl = provider.baseUrl.trim()
  const modelId = provider.modelId.trim()
  const key = apiKey?.trim() ?? ''
  const environment: Record<string, string> =
    provider.protocol === 'anthropic'
      ? { ANTHROPIC_BASE_URL: baseUrl, ANTHROPIC_MODEL: modelId }
      : { OPENAI_BASE_URL: baseUrl, OPENAI_API_BASE: baseUrl, OPENAI_MODEL: modelId }
  if (key !== '') {
    environment[provider.protocol === 'anthropic' ? 'ANTHROPIC_AUTH_TOKEN' : 'OPENAI_API_KEY'] = key
  }
  if (provider.protocol === 'anthropic' && provider.outputTokens !== null) {
    environment.CLAUDE_CODE_MAX_OUTPUT_TOKENS = String(provider.outputTokens)
  }
  return environment
}

export interface ProviderProbe {
  url: string
  headers: Record<string, string>
}

export type ProviderTestResult = { kind: 'works'; message: string } | { kind: 'failed'; message: string }

const ANTHROPIC_VERSION = '2023-06-01'

function withoutTrailingSlashes(url: string): string {
  let trimmed = url.trim()
  while (trimmed.endsWith('/')) {
    trimmed = trimmed.slice(0, -1)
  }
  return trimmed
}

export function providerProbe(provider: CustomProvider, apiKey: string | null): ProviderProbe {
  const baseUrl = withoutTrailingSlashes(provider.baseUrl)
  const key = apiKey?.trim() ?? ''
  const headers: Record<string, string> = key === '' ? {} : { Authorization: `Bearer ${key}` }
  if (provider.protocol === 'anthropic') {
    return {
      url: `${baseUrl}/v1/models`,
      headers: key === '' ? { 'anthropic-version': ANTHROPIC_VERSION } : { ...headers, 'x-api-key': key, 'anthropic-version': ANTHROPIC_VERSION }
    }
  }
  return { url: `${baseUrl}/models`, headers }
}

export function listedModelIds(raw: unknown): string[] | null {
  if (!isRecord(raw) || !Array.isArray(raw.data)) {
    return null
  }
  return raw.data.flatMap((entry) => (isRecord(entry) && typeof entry.id === 'string' ? [entry.id] : []))
}

export function describeProviderAnswer(provider: CustomProvider, status: number, body: unknown): ProviderTestResult {
  if (status === 401 || status === 403) {
    return { kind: 'failed', message: `The provider answered but refused the key (${status}). Check the API key.` }
  }
  if (status === 404) {
    const hint =
      provider.protocol === 'anthropic'
        ? 'Anthropic-compatible URLs usually end before /v1, for example https://api.example.com/anthropic.'
        : 'OpenAI-compatible URLs usually end with /v1, for example https://api.example.com/v1.'
    return { kind: 'failed', message: `Nothing answered at this URL (404). ${hint}` }
  }
  if (status < 200 || status >= 300) {
    return { kind: 'failed', message: `The provider answered with an error (${status}).` }
  }
  const models = listedModelIds(body)
  if (models === null || models.length === 0) {
    return { kind: 'works', message: 'The provider answered. It does not list its models, so the model ID could not be checked.' }
  }
  return models.includes(provider.modelId.trim())
    ? { kind: 'works', message: `The provider answered and offers ${provider.modelId.trim()}.` }
    : {
        kind: 'works',
        message: `The provider answered, but ${provider.modelId.trim()} is not in its list of ${models.length} models. Check the model ID.`
      }
}
