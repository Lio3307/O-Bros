import { describe, expect, it } from 'vitest'
import { describeSyncState, isPrimaryBranch } from './gitSync'

describe('describeSyncState', () => {
  it('reports no upstream first', () => {
    expect(describeSyncState({ upstream: null, ahead: 3, behind: 1 })).toBe('no-upstream')
  })

  it('distinguishes ahead, behind, diverged and up to date', () => {
    expect(describeSyncState({ upstream: 'origin/main', ahead: 2, behind: 0 })).toBe('ahead')
    expect(describeSyncState({ upstream: 'origin/main', ahead: 0, behind: 3 })).toBe('behind')
    expect(describeSyncState({ upstream: 'origin/main', ahead: 2, behind: 3 })).toBe('diverged')
    expect(describeSyncState({ upstream: 'origin/main', ahead: 0, behind: 0 })).toBe('up-to-date')
  })
})

describe('isPrimaryBranch', () => {
  it('accepts main and master only', () => {
    expect(isPrimaryBranch('main')).toBe(true)
    expect(isPrimaryBranch('master')).toBe(true)
    expect(isPrimaryBranch('feature/login')).toBe(false)
  })
})
