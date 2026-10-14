import { dialog, ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { classifyNewRoot } from '../../shared/projectRoots'
import type { AddRootResult } from '../../shared/types'
import { listProjectRoots } from '../services/projectScanner'
import { findRepositories } from '../services/repositoryFinder'
import { readProjectScripts } from '../services/scriptService'
import { loadSettings, saveSettings } from '../settings'

const IS_PATH_CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin'

async function addProjectRoot(): Promise<AddRootResult> {
  const choice = await dialog.showOpenDialog({ properties: ['openDirectory'] })
  const [chosenPath] = choice.filePaths
  if (choice.canceled || chosenPath === undefined) {
    return { roots: await listProjectRoots(), outcome: 'cancelled', matchedRootPath: null, chosenPath: null }
  }

  const settings = await loadSettings()
  const classification = classifyNewRoot(chosenPath, settings.projectRoots, IS_PATH_CASE_INSENSITIVE)
  if (classification.kind === 'new') {
    await saveSettings({ ...settings, projectRoots: [...settings.projectRoots, chosenPath] })
  }

  const outcomeByKind = { new: 'added', same: 'already-added', inside: 'inside-existing' } as const
  return {
    roots: await listProjectRoots(),
    outcome: outcomeByKind[classification.kind],
    matchedRootPath: classification.matchedRootPath,
    chosenPath
  }
}

async function removeProjectRoot(rootPath: string) {
  const settings = await loadSettings()
  await saveSettings({ ...settings, projectRoots: settings.projectRoots.filter((root) => root !== rootPath) })
  return listProjectRoots()
}

export function registerProjectsIpc(): void {
  ipcMain.handle(IpcChannel.projectsList, () => listProjectRoots())
  ipcMain.handle(IpcChannel.projectsAddRoot, () => addProjectRoot())
  ipcMain.handle(IpcChannel.projectsRemoveRoot, (_event, rootPath: string) => removeProjectRoot(rootPath))
  ipcMain.handle(IpcChannel.projectsScripts, (_event, rootPath: string) => readProjectScripts(rootPath))
  ipcMain.handle(IpcChannel.projectsRepositories, (_event, folderPath: string) => findRepositories(folderPath))
}
