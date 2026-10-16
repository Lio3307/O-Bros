import { describe, expect, it } from 'vitest'
import { describeRemovalFailure, summarizeRemoval } from './sessionRemovalResult'

describe('describeRemovalFailure', () => {
  it('explains files that are in use', () => {
    expect(describeRemovalFailure(['ENOENT', 'EBUSY'])).toContain('open in Claude or Codex')
  })

  it('explains files that stayed after deleting', () => {
    expect(describeRemovalFailure(['STILL_THERE'])).toContain('still there')
  })
})

describe('summarizeRemoval', () => {
  it('reports a full success', () => {
    const summary = summarizeRemoval({ removedCount: 3, freedBytes: 2048, failedCount: 0, failureReason: null }, true)
    expect(summary).toEqual({ kind: 'success', message: 'Deleted 3 sessions, freeing 2.0 KB.' })
  })

  it('reports a partial result as a warning with both numbers', () => {
    const summary = summarizeRemoval({ removedCount: 2, freedBytes: 0, failedCount: 1, failureReason: 'Close Codex.' }, false)
    expect(summary.kind).toBe('warning')
    expect(summary.message).toContain('2 sessions')
    expect(summary.message).toContain('1 session could not be deleted. Close Codex.')
  })

  it('reports nothing deleted as an error', () => {
    const summary = summarizeRemoval({ removedCount: 0, freedBytes: 0, failedCount: 4, failureReason: 'Close Codex.' }, true)
    expect(summary).toEqual({ kind: 'error', message: '4 sessions could not be deleted. Close Codex.' })
  })
})
