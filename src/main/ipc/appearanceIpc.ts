import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { startFollowingDesktop, stopFollowingDesktop } from '../services/appearance/desktopFollower'
import { chooseWallpaper, loadWallpaper, removeWallpaper } from '../services/appearance/wallpaper'
import { showTitleBarSeeThrough } from '../window'

export function registerAppearanceIpc(): void {
  ipcMain.handle(IpcChannel.appearanceLoadWallpaper, () => loadWallpaper())
  ipcMain.handle(IpcChannel.appearanceChooseWallpaper, (event) => chooseWallpaper(BrowserWindow.fromWebContents(event.sender)))
  ipcMain.handle(IpcChannel.appearanceRemoveWallpaper, () => removeWallpaper())
  ipcMain.handle(IpcChannel.appearanceSetTitleBarSeeThrough, (event, isSeeThrough: unknown) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window !== null) {
      showTitleBarSeeThrough(window, isSeeThrough === true)
    }
  })
  ipcMain.handle(IpcChannel.appearanceFollowDesktop, (event, isFollowing: unknown) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window === null) {
      return null
    }
    if (isFollowing !== true) {
      stopFollowingDesktop(window)
      return null
    }
    return startFollowingDesktop(window)
  })
}
