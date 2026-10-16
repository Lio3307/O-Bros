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
      formatOnSave: true
    })
    expect(settings.disabledLanguages).toEqual(['python'])
    expect(settings.lintMode).toBe('as-you-type')
    expect(settings.formatOnSave).toBe(true)
  })

  it('rejects an unknown lint mode and ignores old snippet data', () => {
    const settings = normalizeEditorSettings({ lintMode: 'sometimes', snippets: { go: [] } })
    expect(settings.lintMode).toBe('on-save')
    expect(settings).not.toHaveProperty('snippets')
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
