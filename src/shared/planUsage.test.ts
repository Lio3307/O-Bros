import { describe, expect, it } from 'vitest'
import { grokPlanName, parseClinePassLimits, parseGrokBilling } from './planUsage'

describe('parseGrokBilling', () => {
  it('reads the used share of the current period and when it resets', () => {
    const reading = parseGrokBilling({
      subscriptionTier: 'SuperGrok',
      config: {
        creditUsagePercent: 37.6,
        currentPeriod: { start: '2026-10-20T00:00:00Z', end: '2026-10-27T00:00:00Z' }
      }
    })
    expect(reading).toEqual({
      plan: 'SuperGrok',
      windows: [{ label: 'wk', window: { percentUsed: 38, resetsAt: Date.parse('2026-10-27T00:00:00Z') } }]
    })
  })

  it('falls back to the billing period and to on-demand spending', () => {
    const reading = parseGrokBilling({
      config: {
        billingPeriodStart: '2026-10-01T00:00:00Z',
        billingPeriodEnd: '2026-11-01T00:00:00Z',
        onDemandCap: { val: 2000 },
        onDemandUsed: { val: 500 },
        subscriptionTier: 'SUBSCRIPTION_TIER_SUPER_GROK_HEAVY'
      }
    })
    expect(reading?.plan).toBe('SuperGrok Heavy')
    expect(reading?.windows).toEqual([{ label: 'mo', window: { percentUsed: 25, resetsAt: Date.parse('2026-11-01T00:00:00Z') } }])
  })

  it('shows no window when the share is unknown, and rejects other answers', () => {
    expect(parseGrokBilling({ config: { currentPeriod: { end: '2026-10-27T00:00:00Z' } } })).toEqual({ plan: null, windows: [] })
    expect(parseGrokBilling({ error: 'x' })).toBeNull()
  })
})

describe('parseClinePassLimits', () => {
  it('reads the 5-hour, weekly and monthly limits in that order', () => {
    const windows = parseClinePassLimits({
      success: true,
      data: {
        limits: [
          { type: 'monthly', percentUsed: 12, resetsAt: '2026-11-01T00:00:00Z' },
          { type: 'five_hour', percentUsed: 101, resetsAt: '2026-10-26T15:00:00Z' },
          { type: 'weekly', percentUsed: 40.4, resetsAt: '2026-10-30T00:00:00Z' },
          { type: 'daily_tokens', percentUsed: 5, resetsAt: '2026-10-27T00:00:00Z' }
        ]
      }
    })
    expect(windows?.map((entry) => [entry.label, entry.window.percentUsed])).toEqual([
      ['5h', 100],
      ['wk', 40],
      ['mo', 12]
    ])
  })

  it('has no windows for an account without ClinePass, and rejects a failed answer', () => {
    expect(parseClinePassLimits({ success: true, data: { limits: [] } })).toEqual([])
    expect(parseClinePassLimits({ success: false })).toBeNull()
  })
})

describe('grokPlanName', () => {
  it('turns tier codes into plan names', () => {
    expect(grokPlanName('supergrok')).toBe('SuperGrok')
    expect(grokPlanName('X Premium+')).toBe('X Premium+')
    expect(grokPlanName('')).toBeNull()
  })
})
