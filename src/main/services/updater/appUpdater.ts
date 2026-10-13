import { app, BrowserWindow, shell } from 'electron'
import { autoUpdater } from 'electron-updater'
import { IpcChannel } from '../../../shared/ipc'
import type { UpdateStatus } from '../../../shared/types'

const RELEASES_URL = 'https://github.com/Lio3307/O-Bros/releases'
const FAILURE_MESSAGE = 'Could not check for updates. Check your connection, or open the releases page.'

let status: UpdateStatus = {
  state: app.isPackaged ? 'idle' : 'unavailable',
  currentVersion: app.getVersion(),
  latestVersion: null,
  percent: 0,
  message: app.isPackaged ? null : 'Updates are only available in the installed app, not when running from source.'
}

function publish(patch: Partial<UpdateStatus>): void {
  status = { ...status, ...patch }
  BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(IpcChannel.updaterStatusChanged, status))
}

export function readUpdateStatus(): UpdateStatus {
  return status
}

export function setUpUpdater(): void {
  if (!app.isPackaged) {
    return
  }

  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => publish({ state: 'checking', message: null }))
  autoUpdater.on('update-available', (info) => publish({ state: 'available', latestVersion: info.version }))
  autoUpdater.on('update-not-available', () => publish({ state: 'upToDate', latestVersion: null }))
  autoUpdater.on('download-progress', (progress) => publish({ state: 'downloading', percent: progress.percent }))
  autoUpdater.on('update-downloaded', () => publish({ state: 'ready', percent: 100 }))
  autoUpdater.on('error', () => publish({ state: 'failed', message: FAILURE_MESSAGE }))
}

export async function checkForUpdate(): Promise<void> {
  if (status.state === 'unavailable' || status.state === 'checking' || status.state === 'downloading') {
    return
  }
  await autoUpdater.checkForUpdates()
}

export async function downloadUpdate(): Promise<void> {
  if (status.state !== 'available') {
    return
  }
  await autoUpdater.downloadUpdate()
}

export async function openReleasesPage(): Promise<void> {
  await shell.openExternal(RELEASES_URL)
}
