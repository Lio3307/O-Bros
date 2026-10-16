import { describe, expect, it } from 'vitest'
import { describeCredit, formatDollars, parseOpenRouterKey, type CreditBalance } from './creditBalance'

describe('parseOpenRouterKey', () => {
  it('reads spending, limit and free tier', () => {
    expect(parseOpenRouterKey({ data: { usage: 0.008, limit: null, limit_remaining: null, is_free_tier: true } })).toEqual({
      spentDollars: 0.008,
      limitDollars: null,
      remainingDollars: null,
      isFreeTier: true
    })
    expect(parseOpenRouterKey({ data: { usage: 4.5, limit: 10, limit_remaining: 5.5 } })?.remainingDollars).toBe(5.5)
  })

  it('returns null for an unexpected answer', () => {
    expect(parseOpenRouterKey({ error: 'x' })).toBeNull()
  })
})

describe('describeCredit', () => {
  const base: CreditBalance = {
    id: 'openrouter',
    name: 'OpenRouter',
    viaTool: 'OpenCode',
    logoCommand: 'openrouter',
    spentDollars: 0.008,
    limitDollars: null,
    remainingDollars: null,
    isFreeTier: true,
    errorMessage: null
  }

  it('describes a free key and a key with a limit', () => {
    expect(describeCredit(base)).toBe('under $0.01 used · free tier')
    expect(describeCredit({ ...base, spentDollars: 4.5, limitDollars: 10, remainingDollars: 5.5, isFreeTier: false })).toBe(
      '$4.50 used · $5.50 of $10.00 left'
    )
  })

  it('says unavailable after an error', () => {
    expect(describeCredit({ ...base, errorMessage: 'rejected' })).toBe('unavailable')
  })
})

describe('formatDollars', () => {
  it('shows zero and amounts with two decimals', () => {
    expect(formatDollars(0)).toBe('$0.00')
    expect(formatDollars(12.345)).toBe('$12.35')
  })
})
