import { describe, expect, it } from 'vitest'
import { usageSupportFor, type UsageFacts } from './usageSupport'

const FACTS: UsageFacts = {
  claudeHasLoginFile: true,
  claudePlan: 'pro',
  codexLoginMode: 'chatgpt',
  codexPlan: 'pro',
  geminiAuthType: 'gemini-api-key',
  grokHasLogin: true,
  clineHasLogin: true
}

describe('usageSupportFor', () => {
  it('shows usage for subscriptions', () => {
    expect(usageSupportFor('claude', FACTS).label).toBe('Usage shown · Claude Pro')
    expect(usageSupportFor('codex', FACTS).label).toBe('Usage shown · ChatGPT Pro')
    expect(usageSupportFor('grok', FACTS).kind).toBe('shown')
    expect(usageSupportFor('cline', FACTS).label).toBe('Usage shown with ClinePass')
  })

  it('asks for a login or a subscription when there is none', () => {
    expect(usageSupportFor('claude', { ...FACTS, claudeHasLoginFile: false }).kind).toBe('needs-login')
    expect(usageSupportFor('claude', { ...FACTS, claudePlan: null }).kind).toBe('needs-subscription')
    expect(usageSupportFor('codex', { ...FACTS, codexLoginMode: 'api-key' }).kind).toBe('needs-subscription')
    expect(usageSupportFor('codex', { ...FACTS, codexLoginMode: null }).kind).toBe('needs-login')
    expect(usageSupportFor('grok', { ...FACTS, grokHasLogin: false }).kind).toBe('needs-login')
    expect(usageSupportFor('cline', { ...FACTS, clineHasLogin: false }).kind).toBe('needs-login')
  })

  it('explains pay-per-use keys and providers without a usage service', () => {
    expect(usageSupportFor('gemini', FACTS).kind).toBe('pay-per-use')
    expect(usageSupportFor('gemini', { ...FACTS, geminiAuthType: 'oauth-personal' }).kind).toBe('not-supported')
    expect(usageSupportFor('opencode', FACTS).kind).toBe('pay-per-use')
    expect(usageSupportFor('kilo', FACTS).kind).toBe('not-supported')
  })
})
