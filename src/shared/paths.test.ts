import { describe, expect, it } from 'vitest'
import { fileExtension, isPathInside, lastPathSegment, parentPath, relativePathFrom } from './paths'

describe('lastPathSegment', () => {
  it('handles both separators', () => {
    expect(lastPathSegment('C:\\dev\\o-bros')).toBe('o-bros')
    expect(lastPathSegment('/home/me/o-bros')).toBe('o-bros')
  })
})

describe('fileExtension', () => {
  it('returns the lowercase extension without the dot', () => {
    expect(fileExtension('src/App.TSX')).toBe('tsx')
  })

  it('returns empty for files without an extension or dotfiles', () => {
    expect(fileExtension('Makefile')).toBe('')
    expect(fileExtension('.gitignore')).toBe('')
  })
})

describe('isPathInside', () => {
  it('matches the folder itself and its children only', () => {
    expect(isPathInside('C:\\dev\\app\\src', 'C:\\dev\\app')).toBe(true)
    expect(isPathInside('C:\\dev\\app', 'C:\\dev\\app')).toBe(true)
    expect(isPathInside('C:\\dev\\app-two', 'C:\\dev\\app')).toBe(false)
  })
})

describe('parentPath and relativePathFrom', () => {
  it('returns the folder that holds an item', () => {
    expect(parentPath('C:\\dev\\app\\src\\a.ts')).toBe('C:/dev/app/src')
  })

  it('makes a path relative to a root', () => {
    expect(relativePathFrom('C:\\dev\\app\\src\\a.ts', 'C:/dev/app')).toBe('src/a.ts')
  })

  it('keeps a path that is outside the root', () => {
    expect(relativePathFrom('D:/other/a.ts', 'C:/dev/app')).toBe('D:/other/a.ts')
  })
})
