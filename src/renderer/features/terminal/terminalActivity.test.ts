import { describe, expect, it } from 'vitest'
import { classifyActivity, recordOutput } from './terminalActivity'

describe('recordOutput', () => {
  it('starts a run on the first output', () => {
    expect(recordOutput(undefined, 1000)).toEqual({ runStartedAt: 1000, lastOutputAt: 1000 })
  })

  it('keeps the run start while output keeps arriving', () => {
    const first = recordOutput(undefined, 1000)
    expect(recordOutput(first, 3500)).toEqual({ runStartedAt: 1000, lastOutputAt: 3500 })
  })

  it('starts a new run after a long silence', () => {
    const first = recordOutput(undefined, 1000)
    expect(recordOutput(first, 9000)).toEqual({ runStartedAt: 9000, lastOutputAt: 9000 })
  })
})

describe('classifyActivity', () => {
  it('is running while output is recent', () => {
    expect(classifyActivity({ runStartedAt: 0, lastOutputAt: 10_000 }, 12_000)).toBe('running')
  })

  it('reports a finished long run after enough quiet', () => {
    expect(classifyActivity({ runStartedAt: 0, lastOutputAt: 10_000 }, 14_500)).toBe('finished-long-run')
  })

  it('does not treat a short burst as a long run', () => {
    expect(classifyActivity({ runStartedAt: 0, lastOutputAt: 500 }, 5000)).toBe('finished-short-run')
  })
})
