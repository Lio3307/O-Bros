import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { isRecord } from '../../shared/isRecord'
import { applyWindowBackground } from '../services/appearance/windowBackground'
import { chooseWallpaper, loadWallpaper, removeWallpaper } from '../services/appearance/wallpaper'

export function registerAppearanceIpc(): void {
  ipcMain.handle(IpcChannel.appearanceLoadWallpaper, () => loadWallpaper())
  ipcMain.handle(IpcChannel.appearanceChooseWallpaper, (event) => chooseWallpaper(BrowserWindow.fromWebContents(event.sender)))
  ipcMain.handle(IpcChannel.appearanceRemoveWallpaper, () => removeWallpaper())
  ipcMain.handle(IpcChannel.appearanceSetWindowBackground, (event, background: unknown) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window !== null && isRecord(background)) {
      applyWindowBackground(window, { isDesktop: background.isDesktop === true, isSeeThrough: background.isSeeThrough === true })
    }
  })
}
