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

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

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
