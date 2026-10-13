import { describe, expect, it } from 'vitest'
import { syncLabel } from './syncLabel'

describe('syncLabel', () => {
  it('describes every sync state', () => {
    expect(syncLabel({ upstream: 'origin/main', ahead: 0, behind: 0 })).toBe('Up to date')
    expect(syncLabel({ upstream: 'origin/main', ahead: 2, behind: 0 })).toBe('↑2 ahead')
    expect(syncLabel({ upstream: 'origin/main', ahead: 0, behind: 3 })).toBe('↓3 behind')
    expect(syncLabel({ upstream: 'origin/main', ahead: 2, behind: 3 })).toBe('↑2 ↓3 diverged')
    expect(syncLabel({ upstream: null, ahead: 0, behind: 0 })).toBe('No upstream')
  })
})
