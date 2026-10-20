import { app, BrowserWindow, dialog, ipcMain } from 'electron'
import { readFile, stat, writeFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { basename, join } from 'node:path'
import { IpcChannel } from '../../shared/ipc'
import { classifyNewRoot } from '../../shared/projectRoots'
import type { OpenedBackupFile } from '../../shared/types'
import { loadSettings, saveSettings } from '../settings'
import { IS_PATH_CASE_INSENSITIVE, isFolder } from '../services/fileSystem'

const MAX_BACKUP_BYTES = 1024 * 1024
const JSON_FILTER = { name: 'O-BROS settings', extensions: ['json'] }

function defaultFolder(): string {
  try {
    return app.getPath('documents')
  } catch {
    return homedir()
  }
}

function focusedWindow(): BrowserWindow | undefined {
  return BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
}

async function saveBackup(text: string, suggestedName: string): Promise<string | null> {
  const window = focusedWindow()
  const options = { defaultPath: join(defaultFolder(), basename(suggestedName)), filters: [JSON_FILTER] }
  const choice = window === undefined ? await dialog.showSaveDialog(options) : await dialog.showSaveDialog(window, options)
  if (choice.canceled || choice.filePath === undefined) {
    return null
  }
  await writeFile(choice.filePath, text, 'utf8')
  return choice.filePath
}

async function openBackup(): Promise<OpenedBackupFile | null> {
  const window = focusedWindow()
  const options = { properties: ['openFile' as const], filters: [JSON_FILTER] }
  const choice = window === undefined ? await dialog.showOpenDialog(options) : await dialog.showOpenDialog(window, options)
  const [filePath] = choice.filePaths
  if (choice.canceled || filePath === undefined) {
    return null
  }
  if ((await stat(filePath)).size > MAX_BACKUP_BYTES) {
    throw new Error('The file is too large to be an O-BROS settings export.')
  }
  return { fileName: basename(filePath), text: await readFile(filePath, 'utf8') }
}

async function addProjectFolders(folderPaths: string[]): Promise<number> {
  const settings = await loadSettings()
  const roots = [...settings.projectRoots]
  for (const folderPath of folderPaths) {
    const isNew = classifyNewRoot(folderPath, roots, IS_PATH_CASE_INSENSITIVE).kind === 'new'
    if (isNew && (await isFolder(folderPath))) {
      roots.push(folderPath)
    }
  }
  await saveSettings({ ...settings, projectRoots: roots })
  return roots.length - settings.projectRoots.length
}

export function registerSettingsBackupIpc(): void {
  ipcMain.handle(IpcChannel.backupSave, (_event, text: string, suggestedName: string) => saveBackup(text, suggestedName))
  ipcMain.handle(IpcChannel.backupOpen, () => openBackup())
  ipcMain.handle(IpcChannel.backupAddProjectFolders, (_event, folderPaths: string[]) =>
    addProjectFolders(Array.isArray(folderPaths) ? folderPaths.filter((path) => typeof path === 'string') : [])
  )
}
