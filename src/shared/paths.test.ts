import { describe, expect, it } from 'vitest'
import { fileExtension, isAbsolutePath, isPathInside, lastPathSegment, parentPath, relativePathFrom, resolvePath } from './paths'

describe('isAbsolutePath', () => {
  it('recognises drive, root and UNC paths', () => {
    expect(isAbsolutePath('C:\\dev\\a.ts')).toBe(true)
    expect(isAbsolutePath('/home/me/a.ts')).toBe(true)
    expect(isAbsolutePath('\\\\server\\share\\a.ts')).toBe(true)
    expect(isAbsolutePath('src/a.ts')).toBe(false)
  })
})

describe('resolvePath', () => {
  it('joins a relative path to the base with the base separator', () => {
    expect(resolvePath('C:\\dev\\app', 'src/a.ts')).toBe('C:\\dev\\app\\src\\a.ts')
    expect(resolvePath('/home/me/app', './src/a.ts')).toBe('/home/me/app/src/a.ts')
  })

  it('applies parent segments without leaving the drive', () => {
    expect(resolvePath('C:\\dev\\app', '..\\other\\b.ts')).toBe('C:\\dev\\other\\b.ts')
    expect(resolvePath('C:\\dev', '../../../b.ts')).toBe('C:\\b.ts')
  })

  it('returns absolute paths unchanged', () => {
    expect(resolvePath('C:\\dev\\app', 'D:\\x\\a.ts')).toBe('D:\\x\\a.ts')
  })
})

describe('lastPathSegment', () => {
  it('handles both separators', () => {
    expect(lastPathSegment('C:\\dev\\o-bros')).toBe('o-bros')
    expect(lastPathSegment('/home/me/o-bros')).toBe('o-bros')
  })

  it('names drive roots and ignores a trailing separator', () => {
    expect(lastPathSegment('E:\\')).toBe('E:')
    expect(lastPathSegment('/')).toBe('/')
    expect(lastPathSegment('src/lib/')).toBe('lib')
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

  it('works when the parent is a drive or file system root', () => {
    expect(isPathInside('E:\\wot-test', 'E:\\')).toBe(true)
    expect(isPathInside('E:\\', 'E:\\')).toBe(true)
    expect(isPathInside('E:', 'E:\\')).toBe(true)
    expect(isPathInside('F:\\other', 'E:\\')).toBe(false)
    expect(isPathInside('/home/me', '/')).toBe(true)
    expect(isPathInside('C:\\dev\\ap', 'C:\\dev\\app')).toBe(false)
  })
})

describe('parentPath and relativePathFrom', () => {
  it('returns the folder that holds an item', () => {
    expect(parentPath('C:\\dev\\app\\src\\a.ts')).toBe('C:/dev/app/src')
  })

  it('keeps a drive root as its own parent', () => {
    expect(parentPath('E:\\wot-test')).toBe('E:/')
    expect(parentPath('E:\\')).toBe('E:/')
    expect(parentPath('/home')).toBe('/home')
  })

  it('makes a path relative to a root', () => {
    expect(relativePathFrom('C:\\dev\\app\\src\\a.ts', 'C:/dev/app')).toBe('src/a.ts')
  })

  it('makes a path relative to a drive or file system root', () => {
    expect(relativePathFrom('E:\\wot-test\\a.ts', 'E:\\')).toBe('wot-test/a.ts')
    expect(relativePathFrom('/home/a.ts', '/')).toBe('home/a.ts')
    expect(relativePathFrom('E:\\', 'E:\\')).toBe('')
  })

  it('keeps a path that is outside the root', () => {
    expect(relativePathFrom('D:/other/a.ts', 'C:/dev/app')).toBe('D:/other/a.ts')
  })
})
