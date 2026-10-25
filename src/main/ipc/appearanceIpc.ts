import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { chooseWallpaper, loadWallpaper, removeWallpaper, showDesktopBehind } from '../services/appearance/wallpaper'

export function registerAppearanceIpc(): void {
  ipcMain.handle(IpcChannel.appearanceLoadWallpaper, () => loadWallpaper())
  ipcMain.handle(IpcChannel.appearanceChooseWallpaper, (event) => chooseWallpaper(BrowserWindow.fromWebContents(event.sender)))
  ipcMain.handle(IpcChannel.appearanceRemoveWallpaper, () => removeWallpaper())
  ipcMain.handle(IpcChannel.appearanceShowDesktop, (event, isSeeThrough: unknown) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window !== null) {
      showDesktopBehind(window, isSeeThrough === true)
    }
  })
}
