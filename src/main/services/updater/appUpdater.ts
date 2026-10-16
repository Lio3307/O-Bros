import { app, BrowserWindow, shell } from 'electron'
import type { AppUpdater } from 'electron-updater'
import { IpcChannel } from '../../../shared/ipc'
import { createSingleFlight } from '../../../shared/singleFlight'
import { allowEveryWindowToClose } from '../../closeGuard'
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

let updaterLoad: Promise<AppUpdater> | null = null

function configure(autoUpdater: AppUpdater): AppUpdater {
  autoUpdater.autoDownload = false
  autoUpdater.autoInstallOnAppQuit = true

  autoUpdater.on('checking-for-update', () => publish({ state: 'checking', message: null }))
  autoUpdater.on('update-available', (info) => publish({ state: 'available', latestVersion: info.version }))
  autoUpdater.on('update-not-available', () => publish({ state: 'upToDate', latestVersion: null }))
  autoUpdater.on('download-progress', (progress) => publish({ state: 'downloading', percent: progress.percent }))
  autoUpdater.on('update-downloaded', () => publish({ state: 'ready', percent: 100 }))
  autoUpdater.on('error', () => publish({ state: 'failed', message: FAILURE_MESSAGE }))
  return autoUpdater
}

function loadUpdater(): Promise<AppUpdater> {
  if (updaterLoad === null) {
    updaterLoad = import('electron-updater').then((module) => configure(module.autoUpdater))
  }
  return updaterLoad
}

const checkOnce = createSingleFlight()
const downloadOnce = createSingleFlight()
const installOnce = createSingleFlight()

const STATES_THAT_BLOCK_A_CHECK: UpdateStatus['state'][] = ['unavailable', 'checking', 'downloading', 'ready']

export async function checkForUpdate(): Promise<void> {
  if (STATES_THAT_BLOCK_A_CHECK.includes(status.state)) {
    return
  }
  await checkOnce(async () => {
    const autoUpdater = await loadUpdater()
    await autoUpdater.checkForUpdates()
  })
}

export async function downloadUpdate(): Promise<void> {
  if (status.state !== 'available') {
    return
  }
  await downloadOnce(async () => {
    publish({ state: 'downloading', percent: 0 })
    const autoUpdater = await loadUpdater()
    await autoUpdater.downloadUpdate()
  })
}

export async function installUpdateAndRestart(): Promise<void> {
  if (status.state !== 'ready') {
    return
  }
  await installOnce(async () => {
    const autoUpdater = await loadUpdater()
    await allowEveryWindowToClose()
    autoUpdater.quitAndInstall(true, true)
  })
}

export async function openReleasesPage(): Promise<void> {
  await shell.openExternal(RELEASES_URL)
}
