import { describe, expect, it } from 'vitest'
import type { UpdateStatus } from '../../../../shared/types'
import { describeUpdate } from './updateDisplay'

function statusOf(patch: Partial<UpdateStatus>): UpdateStatus {
  return { state: 'idle', currentVersion: '0.1.1', latestVersion: null, percent: 0, message: null, ...patch }
}

describe('describeUpdate', () => {
  it('shows the Latest tag in the success tone when up to date', () => {
    const display = describeUpdate(statusOf({ state: 'upToDate' }))
    expect(display.tone).toBe('success')
    expect(display.tag).toBe('Latest')
    expect(display.detail).toContain('0.1.1')
  })

  it('names the new version and tags it New when one is available', () => {
    const display = describeUpdate(statusOf({ state: 'available', latestVersion: '0.2.0' }))
    expect(display.title).toContain('0.2.0')
    expect(display.tag).toBe('New')
    expect(display.tone).toBe('attention')
  })

  it('shows progress only while downloading', () => {
    expect(describeUpdate(statusOf({ state: 'downloading', latestVersion: '0.2.0' })).showsProgress).toBe(true)
    expect(describeUpdate(statusOf({ state: 'ready', latestVersion: '0.2.0' })).showsProgress).toBe(false)
  })

  it('uses the failure message and a neutral tone when the check failed', () => {
    const display = describeUpdate(statusOf({ state: 'failed', message: 'No connection.' }))
    expect(display.detail).toBe('No connection.')
    expect(display.tone).toBe('neutral')
  })

  it('falls back to Not checked yet before the status has loaded', () => {
    expect(describeUpdate(null).title).toBe('Not checked yet')
  })
})
