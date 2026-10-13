import { describe, expect, it } from 'vitest'
import { findEntryNameProblem } from './entryName'

describe('findEntryNameProblem', () => {
  it('accepts normal names', () => {
    expect(findEntryNameProblem('index.ts')).toBeNull()
    expect(findEntryNameProblem('.gitignore')).toBeNull()
    expect(findEntryNameProblem('my folder')).toBeNull()
  })

  it('rejects empty names', () => {
    expect(findEntryNameProblem('   ')).toBe('empty')
  })

  it('rejects path separators so a name cannot escape its folder', () => {
    expect(findEntryNameProblem('../secret')).toBe('has-separator')
    expect(findEntryNameProblem('a\\b')).toBe('has-separator')
  })

  it('rejects reserved and unsafe names', () => {
    expect(findEntryNameProblem('..')).toBe('reserved')
    expect(findEntryNameProblem('what?')).toBe('invalid-character')
    expect(findEntryNameProblem('name.')).toBe('ends-with-dot-or-space')
  })
})
