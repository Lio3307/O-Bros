import { dialog, ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { classifyNewRoot } from '../../shared/projectRoots'
import { repositorySearchDepthOf } from '../../shared/repositorySearch'
import type { AddRootResult } from '../../shared/types'
import { listProjectRoots } from '../services/projectScanner'
import { findRepositories } from '../services/repositoryFinder'
import { readProjectScripts } from '../services/scriptService'
import { loadSettings, saveSettings } from '../settings'
import { IS_PATH_CASE_INSENSITIVE } from '../services/fileSystem'

async function addProjectRoot(title: unknown): Promise<AddRootResult> {
  const dialogTitle = typeof title === 'string' && title.trim() !== '' ? title : undefined
  const choice = await dialog.showOpenDialog({ title: dialogTitle, properties: ['openDirectory'] })
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
  ipcMain.handle(IpcChannel.projectsAddRoot, (_event, title: unknown) => addProjectRoot(title))
  ipcMain.handle(IpcChannel.projectsRemoveRoot, (_event, rootPath: string) => removeProjectRoot(rootPath))
  ipcMain.handle(IpcChannel.projectsScripts, (_event, rootPath: string) => readProjectScripts(rootPath))
  ipcMain.handle(IpcChannel.projectsRepositories, async (_event, folderPath: string) =>
    findRepositories(folderPath, (await loadSettings()).repositorySearchDepth)
  )
  ipcMain.handle(IpcChannel.projectsSearchDepth, async () => (await loadSettings()).repositorySearchDepth)
  ipcMain.handle(IpcChannel.projectsSetSearchDepth, async (_event, depth: unknown) => {
    await saveSettings({ ...(await loadSettings()), repositorySearchDepth: repositorySearchDepthOf(depth) })
  })
}
