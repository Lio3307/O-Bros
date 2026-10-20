import { app, shell } from 'electron'
import { readFile, stat } from 'node:fs/promises'
import { homedir } from 'node:os'
import { dirname, join, normalize } from 'node:path'
import { parseHistoryFolders, type AgentHistoryFolder } from '../../../shared/historyFolders'
import type { DataLocation, DataLocationKind } from '../../../shared/types'
import { logDirectory } from '../logging/logFile'
import { readSessionSources } from '../sessions/sessionSources'
import { listSkillTargets } from '../wot/skillInstaller'
import { WOT_TASK_FOLDER } from '../wot/wotTaskFiles'

const HISTORY_FOLDERS_PATH = join(__dirname, '../../resources/agents/history-folders.json')

function locationOf(kind: DataLocationKind, path: string, accountLabel: string | null): DataLocation {
  return { id: `${kind}:${path}`, kind, path, accountLabel, copy: null }
}

async function isFolder(path: string): Promise<boolean> {
  try {
    return (await stat(path)).isDirectory()
  } catch {
    return false
  }
}

export async function readAgentHistoryFolders(): Promise<AgentHistoryFolder[]> {
  const raw: unknown = JSON.parse(await readFile(HISTORY_FOLDERS_PATH, 'utf8'))
  const folders = parseHistoryFolders(raw, homedir()).map((folder) => ({ ...folder, path: normalize(folder.path) }))
  const existing = await Promise.all(folders.map((folder) => isFolder(folder.path)))
  return folders.filter((_folder, index) => existing[index])
}

async function listAgentHistoryLocations(): Promise<DataLocation[]> {
  return (await readAgentHistoryFolders()).map((folder) => ({ ...locationOf('agentHistory', folder.path, null), copy: { title: folder.title, note: folder.note, command: folder.command } }))
}

function userCacheDirectory(): string {
  if (process.platform === 'win32') {
    return process.env.LOCALAPPDATA ?? join(homedir(), 'AppData', 'Local')
  }
  if (process.platform === 'darwin') {
    return join(homedir(), 'Library', 'Caches')
  }
  return process.env.XDG_CACHE_HOME ?? join(homedir(), '.cache')
}

export async function listDataLocations(): Promise<DataLocation[]> {
  const [sources, skillTargets, agentHistoryLocations] = await Promise.all([
    readSessionSources(),
    listSkillTargets().catch(() => []),
    listAgentHistoryLocations().catch(() => [])
  ])
  const skillLocations = skillTargets
    .filter((target) => target.status !== 'missing')
    .map((target) => locationOf('wotSkill', dirname(target.skillPath), target.title))
  const sessionLocations = sources.map((source) =>
    locationOf(
      source.account.provider === 'claude' ? 'claudeSessions' : 'codexSessions',
      source.directory,
      source.account.label
    )
  )
  const programLocations = app.isPackaged ? [locationOf('program', dirname(app.getPath('exe')), null)] : []
  const updaterLocations = app.isPackaged
    ? [locationOf('updater', join(userCacheDirectory(), `${app.getName()}-updater`), null)]
    : []

  return [
    ...programLocations,
    locationOf('appData', app.getPath('userData'), null),
    locationOf('logs', logDirectory(), null),
    ...updaterLocations,
    ...sessionLocations,
    ...agentHistoryLocations,
    locationOf('teamTaskFiles', WOT_TASK_FOLDER, null),
    ...skillLocations
  ]
}

export async function openDataLocation(id: string): Promise<void> {
  const location = (await listDataLocations()).find((candidate) => candidate.id === id)
  if (location === undefined) {
    throw new Error(`Not a known data folder: ${id}`)
  }
  const failure = await shell.openPath(location.path)
  if (failure !== '') {
    throw new Error(`ENOENT: ${failure}`)
  }
}
