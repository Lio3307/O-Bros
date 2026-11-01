import { describe, expect, it } from 'vitest'
import { isPlanProviderOnComputer, PLAN_PROVIDERS, planProviderNote, planProviderOf, planUsageRowOf } from './planProviders'
import type { UsageFacts } from './usageSupport'

const FACTS: UsageFacts = {
  claudeHasLoginFile: true,
  claudePlan: 'max',
  codexLoginMode: null,
  codexPlan: null,
  geminiAuthType: null,
  grokHasLogin: false,
  clineHasLogin: true
}

describe('plan providers', () => {
  it('counts a provider as on this computer when its CLI is installed or it is signed in', () => {
    const grok = planProviderOf('grok')!
    expect(isPlanProviderOnComputer(grok, ['claude', 'cline'], FACTS)).toBe(false)
    expect(isPlanProviderOnComputer(grok, ['grok'], FACTS)).toBe(true)
    expect(isPlanProviderOnComputer(planProviderOf('claude')!, [], FACTS)).toBe(true)
    expect(PLAN_PROVIDERS.filter((provider) => isPlanProviderOnComputer(provider, ['codex', 'cline'], FACTS)).map((provider) => provider.id)).toEqual([
      'claude',
      'codex',
      'clinepass'
    ])
  })

  it('says how to sign in, or that a signed-in account has no plan with limits', () => {
    expect(planProviderNote(planProviderOf('codex')!, FACTS, [])).toBe('Not signed in · run codex and sign in with your ChatGPT plan')
    expect(planProviderNote(planProviderOf('clinepass')!, FACTS, [])).toBe('This account has no ClinePass plan with limits')
    expect(planProviderNote(planProviderOf('clinepass')!, FACTS, ['clinepass'])).toBeNull()
    expect(planProviderNote(planProviderOf('claude')!, FACTS, [])).toBeNull()
    expect(planProviderNote(planProviderOf('claude')!, null, [])).toBeNull()
  })
})

describe('planUsageRowOf', () => {
  const claude = planProviderOf('claude')!
  const clinePass = planProviderOf('clinepass')!
  const codex = planProviderOf('codex')!

  it('can be shown only when there are numbers, even if the latest check failed', () => {
    expect(planUsageRowOf(claude, FACTS, [], { hasNumbers: true, errorMessage: 'Timed out' })).toEqual({ state: 'showing', text: 'Limits: 5-hour and weekly' })
  })

  it('passes on the problem and how to fix it', () => {
    expect(planUsageRowOf(clinePass, FACTS, ['clinepass'], { hasNumbers: false, errorMessage: 'The sign-in has expired.' })).toEqual({ state: 'problem', text: 'The sign-in has expired.' })
  })

  it('says why there is nothing to show', () => {
    const nothing = { hasNumbers: false, errorMessage: null }
    expect(planUsageRowOf(codex, FACTS, [], nothing).text).toBe('Not signed in · run codex and sign in with your ChatGPT plan')
    expect(planUsageRowOf(clinePass, FACTS, [], nothing).text).toBe('This account has no ClinePass plan with limits')
    expect(planUsageRowOf(claude, FACTS, [], nothing)).toEqual({ state: 'unavailable', text: 'Checking…' })
    expect(planUsageRowOf(claude, null, [], nothing)).toEqual({ state: 'unavailable', text: 'Checking…' })
  })
})
