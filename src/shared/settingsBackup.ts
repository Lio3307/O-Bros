export const BACKUP_FORMAT = 'o-bros-settings'
export const BACKUP_FORMAT_VERSION = 1
export const SETTING_KEY_PREFIX = 'o-bros.'

export const BACKUP_SETTING_KEYS = [
  'colorTheme',
  'editorSettings',
  'shortcuts',
  'prompts',
  'agentLaunchers',
  'shownAgents',
  'hiddenUsageProviders',
  'terminalFontSize',
  'terminalScrollback',
  'terminalGpuRendering',
  'notifyWhenFinished',
  'agentGitPolicy',
  'agentCommitIdentity',
  'allowAgentCoAuthors',
  'teamPolicy'
]

export interface SettingsBackup {
  format: string
  formatVersion: number
  appVersion: string
  exportedAt: string
  settings: Record<string, unknown>
  projectFolders?: string[]
}

export type BackupReadResult = { kind: 'ok'; backup: SettingsBackup } | { kind: 'invalid'; reason: string }

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readableValue(stored: string): unknown {
  try {
    return JSON.parse(stored)
  } catch {
    return stored
  }
}

export function storedValueOf(value: unknown): string {
  return typeof value === 'string' ? value : JSON.stringify(value)
}

export function buildBackup(
  readStored: (key: string) => string | null,
  appVersion: string,
  exportedAt: Date,
  projectFolders: string[] | null
): SettingsBackup {
  const settings: Record<string, unknown> = {}
  for (const key of BACKUP_SETTING_KEYS) {
    const stored = readStored(SETTING_KEY_PREFIX + key)
    if (stored !== null) {
      settings[key] = readableValue(stored)
    }
  }
  const backup: SettingsBackup = {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion,
    exportedAt: exportedAt.toISOString(),
    settings
  }
  return projectFolders === null ? backup : { ...backup, projectFolders }
}

function knownSettingsOf(raw: Record<string, unknown>): Record<string, unknown> {
  const settings: Record<string, unknown> = {}
  for (const key of BACKUP_SETTING_KEYS) {
    if (key in raw && raw[key] !== null && raw[key] !== undefined) {
      settings[key] = raw[key]
    }
  }
  return settings
}

function folderListOf(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) {
    return undefined
  }
  return value.filter((folder): folder is string => typeof folder === 'string' && folder.trim() !== '')
}

export function readBackup(text: string): BackupReadResult {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { kind: 'invalid', reason: 'The file is not valid JSON.' }
  }
  if (!isRecord(parsed) || parsed.format !== BACKUP_FORMAT) {
    return { kind: 'invalid', reason: 'This file is not an O-BROS settings export.' }
  }
  const formatVersion = typeof parsed.formatVersion === 'number' ? parsed.formatVersion : 0
  if (formatVersion < 1) {
    return { kind: 'invalid', reason: 'The file has no valid format version.' }
  }
  if (formatVersion > BACKUP_FORMAT_VERSION) {
    return { kind: 'invalid', reason: 'This file was made by a newer O-BROS. Update O-BROS first.' }
  }
  if (!isRecord(parsed.settings)) {
    return { kind: 'invalid', reason: 'The file has no settings in it.' }
  }
  const backup: SettingsBackup = {
    format: BACKUP_FORMAT,
    formatVersion,
    appVersion: typeof parsed.appVersion === 'string' ? parsed.appVersion : 'unknown',
    exportedAt: typeof parsed.exportedAt === 'string' ? parsed.exportedAt : '',
    settings: knownSettingsOf(parsed.settings)
  }
  const projectFolders = folderListOf(parsed.projectFolders)
  return { kind: 'ok', backup: projectFolders === undefined ? backup : { ...backup, projectFolders } }
}

export function backupFileName(date: Date): string {
  return `o-bros-settings-${date.toISOString().slice(0, 10)}.json`
}
