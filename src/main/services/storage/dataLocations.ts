import { app, shell } from 'electron'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import type { DataLocation, DataLocationKind } from '../../../shared/types'
import { logDirectory } from '../logging/logFile'
import { readSessionSources } from '../sessions/sessionSources'

function locationOf(kind: DataLocationKind, path: string, accountLabel: string | null): DataLocation {
  return { id: `${kind}:${path}`, kind, path, accountLabel }
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
  const sources = await readSessionSources()
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
    ...sessionLocations
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
