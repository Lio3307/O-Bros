import { describe, expect, it } from 'vitest'
import { findLanguageForFile } from './languageRegistry'

describe('findLanguageForFile', () => {
  it('finds the env language for dot env files', () => {
    expect(findLanguageForFile('C:/app/.env')?.id).toBe('env')
    expect(findLanguageForFile('C:/app/.env.local')?.id).toBe('env')
    expect(findLanguageForFile('C:\\app\\.env.production')?.id).toBe('env')
    expect(findLanguageForFile('C:/app/settings.ini')?.id).toBe('env')
  })

  it('finds the text language for text and log files', () => {
    expect(findLanguageForFile('C:/app/notes.txt')?.id).toBe('text')
    expect(findLanguageForFile('C:/app/server.LOG')?.id).toBe('text')
  })

  it('keeps code languages unchanged', () => {
    expect(findLanguageForFile('C:/app/main.ts')?.id).toBe('typescript')
    expect(findLanguageForFile('C:/app/environment.json')?.id).toBe('json')
  })

  it('returns null for unknown files', () => {
    expect(findLanguageForFile('C:/app/image.png')).toBeNull()
  })
})
