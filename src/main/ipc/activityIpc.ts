import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { clearActivity, listActivity } from '../services/activity/activityLog'
import { listLiveAgents } from '../services/activity/liveAgents'

export function registerActivityIpc(): void {
  ipcMain.handle(IpcChannel.activityList, () => listActivity())
  ipcMain.handle(IpcChannel.activityClear, () => clearActivity())
  ipcMain.handle(IpcChannel.activityLive, () => listLiveAgents())
}
