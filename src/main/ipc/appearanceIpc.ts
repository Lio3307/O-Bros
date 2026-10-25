import { BrowserWindow, ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { startFollowingDesktop, stopFollowingDesktop } from '../services/appearance/desktopFollower'
import { chooseWallpaper, loadWallpaper, removeWallpaper } from '../services/appearance/wallpaper'
import { paintWindow } from '../window'
import { isHexColor } from '../../shared/hexColor'
import { isRecord } from '../../shared/isRecord'
import { readWarpThemes } from '../services/appearance/warpThemes'

export function registerAppearanceIpc(): void {
  ipcMain.handle(IpcChannel.appearanceLoadWallpaper, () => loadWallpaper())
  ipcMain.handle(IpcChannel.appearanceChooseWallpaper, (event) => chooseWallpaper(BrowserWindow.fromWebContents(event.sender)))
  ipcMain.handle(IpcChannel.appearanceRemoveWallpaper, () => removeWallpaper())
  ipcMain.handle(IpcChannel.appearanceSetWindowColors, (event, colors: unknown) => {
    const window = BrowserWindow.fromWebContents(event.sender)
    if (window !== null && isRecord(colors) && isHexColor(colors.window) && isHexColor(colors.titleBar) && isHexColor(colors.symbols)) {
      paintWindow(window, { window: colors.window, titleBar: colors.titleBar, symbols: colors.symbols })
    }
  })
  ipcMain.handle(IpcChannel.appearanceReadWarpThemes, () => readWarpThemes())
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
