import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import {
  checkForUpdate,
  downloadUpdate,
  installUpdateAndRestart,
  openReleasesPage,
  readUpdateStatus
} from '../services/updater/appUpdater'

export function registerUpdaterIpc(): void {
  ipcMain.handle(IpcChannel.updaterStatus, () => readUpdateStatus())
  ipcMain.handle(IpcChannel.updaterCheck, () => checkForUpdate())
  ipcMain.handle(IpcChannel.updaterDownload, () => downloadUpdate())
  ipcMain.handle(IpcChannel.updaterInstall, () => installUpdateAndRestart())
  ipcMain.handle(IpcChannel.updaterOpenReleases, (_event, version: unknown) => openReleasesPage(version))
}
