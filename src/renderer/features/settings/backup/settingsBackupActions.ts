import { friendlyErrorMessage } from '../../../../shared/friendlyError'
import {
  backupFileName,
  buildBackup,
  readBackup,
  SETTING_KEY_PREFIX,
  storedValueOf,
  type SettingsBackup
} from '../../../../shared/settingsBackup'
import { askToConfirm } from '../../../state/confirmStore'
import { useProjectsStore } from '../../../state/projectsStore'
import { toast } from '../../../state/toastStore'
import { readStored } from '../../../state/browserStorage'

function writeStoredOrFail(key: string, value: string): void {
  localStorage.setItem(key, value)
}

function describeExportDate(backup: SettingsBackup): string {
  const date = new Date(backup.exportedAt)
  return Number.isNaN(date.getTime()) ? 'an unknown date' : date.toLocaleString()
}

export async function exportSettings(includeProjectFolders: boolean): Promise<void> {
  try {
    const status = await window.api.updater.status()
    const projectFolders = includeProjectFolders ? useProjectsStore.getState().roots.map((root) => root.path) : null
    const now = new Date()
    const backup = buildBackup(readStored, status.currentVersion, now, projectFolders)
    const savedPath = await window.api.backup.save(`${JSON.stringify(backup, null, 2)}\n`, backupFileName(now))
    if (savedPath !== null) {
      toast.success(`Exported ${Object.keys(backup.settings).length} settings to ${savedPath}.`)
    }
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not export the settings.'))
  }
}

async function confirmImport(fileName: string, backup: SettingsBackup): Promise<boolean> {
  const folderCount = backup.projectFolders?.length ?? 0
  const lines = [
    `${fileName} was exported from O-BROS ${backup.appVersion} on ${describeExportDate(backup)}.`,
    '',
    `It has ${Object.keys(backup.settings).length} settings. They replace yours; settings that are not in the file stay as they are.`,
    ...(folderCount > 0 ? [`${folderCount} project folders are added when they exist on this computer.`] : []),
    '',
    'The window reloads to apply them. Open terminals restart in the same folders, and team members stop.'
  ]
  return askToConfirm({ title: 'Import these settings?', message: lines.join('\n'), confirmLabel: 'Import' })
}

export async function importSettings(): Promise<void> {
  try {
    const opened = await window.api.backup.open()
    if (opened === null) {
      return
    }
    const result = readBackup(opened.text)
    if (result.kind === 'invalid') {
      toast.error(result.reason)
      return
    }
    if (!(await confirmImport(opened.fileName, result.backup))) {
      return
    }
    for (const [key, value] of Object.entries(result.backup.settings)) {
      writeStoredOrFail(SETTING_KEY_PREFIX + key, storedValueOf(value))
    }
    if (result.backup.projectFolders !== undefined && result.backup.projectFolders.length > 0) {
      await window.api.backup.addProjectFolders(result.backup.projectFolders)
    }
    window.location.reload()
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not import the settings.'))
  }
}
