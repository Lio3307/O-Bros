import { describe, expect, it } from 'vitest'
import {
  draftProblem,
  keyHintOf,
  parseCustomProviders,
  parseTokenCount,
  providerEnvironment,
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
