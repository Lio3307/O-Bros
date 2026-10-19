import { describe, expect, it } from 'vitest'
import { hasConflictMarkers } from './conflictMarkers'

describe('hasConflictMarkers', () => {
  it('finds a conflict block left by git', () => {
    expect(hasConflictMarkers('a\n<<<<<<< HEAD\nmine\n=======\ntheirs\n>>>>>>> feature\nb\n')).toBe(true)
  })

  it('ignores files without a whole block or with markers inside a line', () => {
    expect(hasConflictMarkers('const arrow = "<<<<<<< not a marker"\n')).toBe(false)
    expect(hasConflictMarkers('<<<<<<< only the start\n')).toBe(false)
    expect(hasConflictMarkers('plain text\n')).toBe(false)
  })
})
