import { describe, expect, it } from 'vitest'
import { accountFolderSuffix } from './accountFolderName'

describe('accountFolderSuffix', () => {
  it('lowercases and joins words with a dash', () => {
    expect(accountFolderSuffix('My Work Account')).toBe('my-work-account')
  })

  it('drops characters that are unsafe in a folder name', () => {
    expect(accountFolderSuffix('  work / ../ team! ')).toBe('work-team')
  })

  it('returns an empty text when nothing usable is left', () => {
    expect(accountFolderSuffix('  ../ ')).toBe('')
  })

  it('limits the length', () => {
    expect(accountFolderSuffix('a'.repeat(100))).toHaveLength(32)
  })
})
