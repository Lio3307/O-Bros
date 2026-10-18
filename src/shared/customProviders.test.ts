import { describe, expect, it } from 'vitest'
import {
  describeProviderAnswer,
  draftProblem,
  keyHintOf,
  parseCustomProviders,
  parseTokenCount,
  providerEnvironment,
  providerProbe,
  type CustomProvider
} from './customProviders'

const ANTHROPIC_PROVIDER: CustomProvider = {
  id: 'p1',
  name: 'My proxy',
  protocol: 'anthropic',
  baseUrl: ' https://proxy.example.com ',
  modelId: 'claude-sonnet-4-5',
  contextTokens: 200_000,
  outputTokens: 32_000
}

describe('custom providers', () => {
  it('keeps valid saved providers only', () => {
    const parsed = parseCustomProviders([ANTHROPIC_PROVIDER, { ...ANTHROPIC_PROVIDER, protocol: 'magic' }, 'x', null])
    expect(parsed).toEqual([ANTHROPIC_PROVIDER])
    expect(parseCustomProviders([{ ...ANTHROPIC_PROVIDER, contextTokens: -1 }])[0].contextTokens).toBeNull()
    expect(parseCustomProviders('not a list')).toEqual([])
  })

  it('reads token counts written with separators', () => {
    expect(parseTokenCount('200,000')).toBe(200_000)
    expect(parseTokenCount('128_000')).toBe(128_000)
    expect(parseTokenCount('')).toBeNull()
    expect(parseTokenCount('lots')).toBeNull()
    expect(parseTokenCount('1.5')).toBeNull()
  })

  it('explains what is missing in a draft', () => {
    expect(draftProblem({ ...ANTHROPIC_PROVIDER, name: ' ' })).toBe('Give the provider a name.')
    expect(draftProblem({ ...ANTHROPIC_PROVIDER, baseUrl: 'ftp://x' })).toContain('https://')
    expect(draftProblem({ ...ANTHROPIC_PROVIDER, modelId: '' })).toContain('model ID')
    expect(draftProblem(ANTHROPIC_PROVIDER)).toBeNull()
  })

  it('shows only the last characters of a key', () => {
    expect(keyHintOf('sk-ant-123456abcd')).toBe('abcd')
    expect(keyHintOf('abc')).toBe('')
  })

  it('builds the variables Anthropic-compatible agents read', () => {
    expect(providerEnvironment(ANTHROPIC_PROVIDER, ' secret ')).toEqual({
      ANTHROPIC_BASE_URL: 'https://proxy.example.com',
      ANTHROPIC_MODEL: 'claude-sonnet-4-5',
      ANTHROPIC_AUTH_TOKEN: 'secret',
      CLAUDE_CODE_MAX_OUTPUT_TOKENS: '32000'
    })
  })

  it('builds the variables OpenAI-compatible agents read, without a key when none is saved', () => {
    const openai: CustomProvider = { ...ANTHROPIC_PROVIDER, protocol: 'openai', modelId: 'gpt-4.1', outputTokens: null }
    expect(providerEnvironment(openai, null)).toEqual({
      OPENAI_BASE_URL: 'https://proxy.example.com',
      OPENAI_API_BASE: 'https://proxy.example.com',
      OPENAI_MODEL: 'gpt-4.1'
    })
  })
})

describe('testing a provider', () => {
  const openai: CustomProvider = { ...ANTHROPIC_PROVIDER, protocol: 'openai', baseUrl: 'https://api.example.com/v1/', modelId: 'gpt-4.1' }

  it('asks the model list of each kind of provider', () => {
    expect(providerProbe(ANTHROPIC_PROVIDER, 'key')).toEqual({
      url: 'https://proxy.example.com/v1/models',
      headers: { Authorization: 'Bearer key', 'x-api-key': 'key', 'anthropic-version': '2023-06-01' }
    })
    expect(providerProbe(openai, null)).toEqual({ url: 'https://api.example.com/v1/models', headers: {} })
  })

  it('explains refused keys, wrong URLs and unknown models', () => {
    expect(describeProviderAnswer(openai, 401, null).message).toContain('refused the key')
    expect(describeProviderAnswer(openai, 404, null).message).toContain('end with /v1')
    expect(describeProviderAnswer(openai, 500, null)).toEqual({ kind: 'failed', message: 'The provider answered with an error (500).' })
    expect(describeProviderAnswer(openai, 200, { data: [{ id: 'gpt-4.1' }] })).toEqual({
      kind: 'works',
      message: 'The provider answered and offers gpt-4.1.'
    })
    expect(describeProviderAnswer(openai, 200, { data: [{ id: 'other' }] }).message).toContain('not in its list of 1 models')
    expect(describeProviderAnswer(openai, 200, 'plain text').message).toContain('does not list its models')
  })
})
