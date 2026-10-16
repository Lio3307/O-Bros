import { describe, expect, it } from 'vitest'
import { describeRestartImpact } from './restartImpact'

describe('describeRestartImpact', () => {
  it('returns null when nothing is running and nothing is unsaved', () => {
    expect(describeRestartImpact(0, 0)).toBeNull()
  })

  it('names running terminals with the right singular and plural', () => {
    expect(describeRestartImpact(1, 0)).toContain('1 terminal is still running something')
    expect(describeRestartImpact(3, 0)).toContain('3 terminals are still running something')
  })

  it('names unsaved files and explains what comes back', () => {
    const message = describeRestartImpact(0, 2)
    expect(message).toContain('2 files have changes that are not saved')
    expect(message).toContain('can be resumed from History')
  })

  it('combines both when both apply', () => {
    const message = describeRestartImpact(1, 1)
    expect(message).toContain('1 terminal is')
    expect(message).toContain('1 file has')
  })
})
