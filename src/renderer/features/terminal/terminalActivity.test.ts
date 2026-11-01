import { describe, expect, it } from 'vitest'
import { isTimeToCheckIfEnded, ranLongEnoughToNotify, type WatchedCommand } from './terminalActivity'

function command(lastOutputAt: number | null, lastCheckedAt: number | null = null): WatchedCommand {
  return { startedAt: 1000, lastOutputAt, lastCheckedAt, tail: '' }
}

describe('isTimeToCheckIfEnded', () => {
  it('waits for quiet', () => {
    expect(isTimeToCheckIfEnded(command(5000), 8000)).toBe(false)
    expect(isTimeToCheckIfEnded(command(5000), 9000)).toBe(true)
  })

  it('checks once per burst of output, so a quiet dev server is not asked about every second', () => {
    expect(isTimeToCheckIfEnded(command(5000, 5000), 60_000)).toBe(false)
    expect(isTimeToCheckIfEnded(command(50_000, 5000), 60_000)).toBe(true)
  })

  it('also checks a command that never printed anything', () => {
    expect(isTimeToCheckIfEnded(command(null), 6000)).toBe(true)
  })
})

describe('ranLongEnoughToNotify', () => {
  it('measures from Enter to the last output, not from the last burst', () => {
    expect(ranLongEnoughToNotify(command(4000))).toBe(false)
    expect(ranLongEnoughToNotify(command(9000))).toBe(true)
  })
})
