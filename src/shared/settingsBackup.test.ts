import { describe, expect, it } from 'vitest'
import { backupFileName, buildBackup, readBackup, storedValueOf } from './settingsBackup'

const STORED: Record<string, string> = {
  'o-bros.colorTheme': 'dracula',
  'o-bros.terminalFontSize': '15',
  'o-bros.shortcuts': '{"openPrompts":"Ctrl+Shift+L"}',
  'o-bros.session': '{"tabs":[]}'
}

function readStored(key: string): string | null {
  return STORED[key] ?? null
}

const EXPORTED_AT = new Date('2026-10-15T08:00:00.000Z')

describe('buildBackup', () => {
  it('exports known settings in readable form and leaves out working state', () => {
    const backup = buildBackup(readStored, '0.1.5', EXPORTED_AT, ['C:/Work/App'])
    expect(backup).toEqual({
      format: 'o-bros-settings',
      formatVersion: 1,
      appVersion: '0.1.5',
      exportedAt: '2026-10-15T08:00:00.000Z',
      settings: { colorTheme: 'dracula', terminalFontSize: 15, shortcuts: { openPrompts: 'Ctrl+Shift+L' } },
      projectFolders: ['C:/Work/App']
    })
  })

  it('can leave out the project folders', () => {
    expect(buildBackup(readStored, '0.1.5', EXPORTED_AT, null).projectFolders).toBeUndefined()
  })
})

describe('readBackup', () => {
  it('reads an export back and turns values into what was stored', () => {
    const text = JSON.stringify(buildBackup(readStored, '0.1.5', EXPORTED_AT, ['C:/Work/App']))
    const result = readBackup(text)
    expect(result.kind).toBe('ok')
    if (result.kind === 'ok') {
      expect(storedValueOf(result.backup.settings.colorTheme)).toBe('dracula')
      expect(storedValueOf(result.backup.settings.terminalFontSize)).toBe('15')
      expect(storedValueOf(result.backup.settings.shortcuts)).toBe(STORED['o-bros.shortcuts'])
      expect(result.backup.projectFolders).toEqual(['C:/Work/App'])
    }
  })

  it('ignores unknown keys', () => {
    const text = JSON.stringify({ format: 'o-bros-settings', formatVersion: 1, settings: { colorTheme: 'nord', session: {}, evil: 1 } })
    const result = readBackup(text)
    expect(result.kind === 'ok' && Object.keys(result.backup.settings)).toEqual(['colorTheme'])
  })

  it('refuses files that are not a valid export', () => {
    expect(readBackup('not json')).toEqual({ kind: 'invalid', reason: 'The file is not valid JSON.' })
    expect(readBackup('{"format":"other"}').kind).toBe('invalid')
    expect(readBackup('{"format":"o-bros-settings","formatVersion":2,"settings":{}}')).toEqual({
      kind: 'invalid',
      reason: 'This file was made by a newer O-BROS. Update O-BROS first.'
    })
    expect(readBackup('{"format":"o-bros-settings","formatVersion":1}').kind).toBe('invalid')
  })
})

describe('backupFileName', () => {
  it('names the file with the date', () => {
    expect(backupFileName(EXPORTED_AT)).toBe('o-bros-settings-2026-10-15.json')
  })
})
