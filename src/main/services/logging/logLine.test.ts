import { describe, expect, it } from 'vitest'
import { formatLogLine } from './logLine'

const NOW = new Date('2026-10-13T08:30:00.000Z')

describe('formatLogLine', () => {
  it('writes the time, the level and the message on one line', () => {
    expect(formatLogLine('error', 'Boom', NOW)).toBe('2026-10-13T08:30:00.000Z ERROR Boom\n')
  })

  it('joins a multi-line message so every entry stays on one line', () => {
    expect(formatLogLine('warning', 'first\nsecond', NOW)).toBe('2026-10-13T08:30:00.000Z WARNING first | second\n')
  })

  it('cuts a very long message', () => {
    const line = formatLogLine('info', 'x'.repeat(5000), NOW)

    expect(line.length).toBeLessThan(2100)
  })
})
