import { describe, expect, it } from 'vitest'
import { clampAutoSaveDelay, defaultEditorSettings, normalizeEditorSettings } from './editorSettings'

describe('normalizeEditorSettings', () => {
  it('returns defaults for missing or broken data', () => {
    expect(normalizeEditorSettings(null)).toEqual(defaultEditorSettings())
    expect(normalizeEditorSettings('text')).toEqual(defaultEditorSettings())
    expect(normalizeEditorSettings([])).toEqual(defaultEditorSettings())
  })

  it('keeps valid saved values', () => {
    const settings = normalizeEditorSettings({
      disabledLanguages: ['python', 'not-a-language'],
      lintMode: 'as-you-type',
      formatOnSave: true,
      snippets: { python: [{ prefix: 'pr', description: 'print', body: 'print(${1})' }] }
    })
    expect(settings.disabledLanguages).toEqual(['python'])
    expect(settings.lintMode).toBe('as-you-type')
    expect(settings.formatOnSave).toBe(true)
    expect(settings.snippets.python).toEqual([{ prefix: 'pr', description: 'print', body: 'print(${1})' }])
  })

  it('falls back to default snippets for languages that were never saved', () => {
    const settings = normalizeEditorSettings({ snippets: {} })
    expect(settings.snippets.cpp).toEqual(defaultEditorSettings().snippets.cpp)
  })

  it('drops snippets without a prefix or body and rejects an unknown lint mode', () => {
    const settings = normalizeEditorSettings({
      lintMode: 'sometimes',
      snippets: { go: [{ prefix: 'ok', body: 'x' }, { prefix: 'bad' }, 4] }
    })
    expect(settings.lintMode).toBe('on-save')
    expect(settings.snippets.go).toEqual([{ prefix: 'ok', description: '', body: 'x' }])
  })
})

describe('auto save settings', () => {
  it('is off by default with a one second delay', () => {
    const settings = defaultEditorSettings()
    expect(settings.autoSaveEnabled).toBe(false)
    expect(settings.autoSaveDelayMs).toBe(1000)
  })

  it('keeps a saved delay and clamps unreasonable ones', () => {
    expect(normalizeEditorSettings({ autoSaveEnabled: true, autoSaveDelayMs: 200 }).autoSaveDelayMs).toBe(200)
    expect(clampAutoSaveDelay(5)).toBe(100)
    expect(clampAutoSaveDelay(10_000_000)).toBe(60_000)
    expect(clampAutoSaveDelay(Number.NaN)).toBe(1000)
  })
})
