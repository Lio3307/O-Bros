import { screen, type BrowserWindow } from 'electron'
import type { EventEmitter } from 'node:events'
import { placementOf, type DesktopPlacement, type DesktopView } from '../../../shared/desktopWallpaper'
import { IpcChannel } from '../../../shared/ipc'
import { readDesktopWallpaper } from './desktopWallpaper'

const WINDOW_PLACEMENT_EVENTS = ['move', 'resize', 'maximize', 'unmaximize', 'restore', 'enter-full-screen', 'leave-full-screen']
const SCREEN_PLACEMENT_EVENTS = ['display-metrics-changed', 'display-added', 'display-removed']

const stopsByWindow = new WeakMap<BrowserWindow, () => void>()

function placementOfWindow(window: BrowserWindow): DesktopPlacement {
  const content = window.getContentBounds()
  return placementOf(screen.getDisplayMatching(content).bounds, content)
}

export function stopFollowingDesktop(window: BrowserWindow): void {
  stopsByWindow.get(window)?.()
  stopsByWindow.delete(window)
}

export async function startFollowingDesktop(window: BrowserWindow): Promise<DesktopView> {
  stopFollowingDesktop(window)
  let sentVersion = ''
  const windowEvents: EventEmitter = window
  const screenEvents: EventEmitter = screen

  const sendPlacement = () => {
    if (!window.isDestroyed()) {
      window.webContents.send(IpcChannel.appearanceDesktopPlacementChanged, placementOfWindow(window))
    }
  }
  const sendChangedWallpaper = () => {
    void readDesktopWallpaper()
      .then((wallpaper) => {
        if (wallpaper.version !== sentVersion && !window.isDestroyed()) {
          sentVersion = wallpaper.version
          window.webContents.send(IpcChannel.appearanceDesktopWallpaperChanged, wallpaper)
        }
      })
      .catch(() => undefined)
  }
  const stop = () => {
    WINDOW_PLACEMENT_EVENTS.forEach((name) => windowEvents.off(name, sendPlacement))
    SCREEN_PLACEMENT_EVENTS.forEach((name) => screenEvents.off(name, sendPlacement))
    windowEvents.off('focus', sendChangedWallpaper)
    windowEvents.off('closed', stop)
  }

  WINDOW_PLACEMENT_EVENTS.forEach((name) => windowEvents.on(name, sendPlacement))
  SCREEN_PLACEMENT_EVENTS.forEach((name) => screenEvents.on(name, sendPlacement))
  windowEvents.on('focus', sendChangedWallpaper)
  windowEvents.on('closed', stop)
  stopsByWindow.set(window, stop)

  const wallpaper = await readDesktopWallpaper()
  if (window.isDestroyed()) {
    throw new Error('The window closed while reading the desktop wallpaper.')
  }
  sentVersion = wallpaper.version
  return { wallpaper, placement: placementOfWindow(window) }
}
