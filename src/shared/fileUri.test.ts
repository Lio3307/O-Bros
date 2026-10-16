import { describe, expect, it } from 'vitest'
import { filePathToUri, fileUriToPath, sameFileUri } from './fileUri'

describe('file URIs', () => {
  it('turns Windows and Unix paths into file URIs and back', () => {
    expect(filePathToUri('C:\\My Projects\\app\\src\\a.ts')).toBe('file:///C:/My%20Projects/app/src/a.ts')
    expect(fileUriToPath('file:///C:/My%20Projects/app/src/a.ts')).toBe('C:\\My Projects\\app\\src\\a.ts')
    expect(filePathToUri('/home/me/app/a#b.ts')).toBe('file:///home/me/app/a%23b.ts')
    expect(fileUriToPath('file:///home/me/app/a%23b.ts')).toBe('/home/me/app/a#b.ts')
    expect(fileUriToPath('https://example.com')).toBeNull()
  })

  it('treats the encodings language servers use for Windows drives as the same file', () => {
    expect(fileUriToPath('file:///c%3A/app/a.ts')).toBe('c:\\app\\a.ts')
    expect(sameFileUri('file:///C:/app/a.ts', 'file:///c%3A/app/a.ts')).toBe(true)
    expect(sameFileUri('file:///C:/app/a.ts', 'file:///C:/app/b.ts')).toBe(false)
    expect(sameFileUri('file:///home/A.ts', 'file:///home/a.ts')).toBe(false)
  })
})
