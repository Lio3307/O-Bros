import { app, screen, type BrowserWindow } from 'electron'
import { readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'
import { DEFAULT_WINDOW_STATE, parseWindowState, startingBounds, type Bounds, type Size, type WindowState } from '../shared/windowBounds'
import { writeLog } from './services/logging/logFile'

const STATE_FILE_NAME = 'window-state.json'
const SAVE_DELAY_MS = 500
const CHANGE_EVENTS = ['resize', 'move', 'maximize', 'unmaximize', 'enter-full-screen', 'leave-full-screen'] as const

function stateFilePath(): string {
  return join(app.getPath('userData'), STATE_FILE_NAME)
}

function loadWindowState(): WindowState {
  try {
    return parseWindowState(JSON.parse(readFileSync(stateFilePath(), 'utf8')))
  } catch {
    return DEFAULT_WINDOW_STATE
  }
}

function isBounds(value: Bounds | Size): value is Bounds {
  return 'x' in value
}

export function showWithSavedState(window: BrowserWindow, minimum: Size): void {
  const state = loadWindowState()
  const workAreas = screen.getAllDisplays().map((display) => display.workArea)
  const bounds = startingBounds(state, workAreas, minimum, window.getBounds())
  if (isBounds(bounds)) {
    window.setBounds(bounds)
  }
  window.show()
  if (state.isFullScreen) {
    window.setFullScreen(true)
  } else if (state.isMaximized) {
    window.maximize()
  }
  rememberWindowState(window)
}

function isNormalSize(window: BrowserWindow): boolean {
  return !window.isMaximized() && !window.isFullScreen() && !window.isMinimized()
}

function saveWindowState(window: BrowserWindow, normalBounds: Bounds | null): void {
  if (window.isDestroyed() || window.isMinimized()) {
    return
  }
  const state: WindowState = {
    bounds: normalBounds ?? window.getNormalBounds(),
    isMaximized: window.isMaximized(),
    isFullScreen: window.isFullScreen()
  }
  try {
    writeFileSync(stateFilePath(), JSON.stringify(state), 'utf8')
  } catch (error) {
    writeLog('error', `Could not save the window size: ${error instanceof Error ? error.message : String(error)}`)
  }
}

function rememberWindowState(window: BrowserWindow): void {
  let saveTimer: NodeJS.Timeout | null = null
  let normalBounds: Bounds | null = isNormalSize(window) ? window.getContentBounds() : null
  const saveSoon = (): void => {
    if (isNormalSize(window)) {
      normalBounds = window.getContentBounds()
    }
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => saveWindowState(window, normalBounds), SAVE_DELAY_MS)
  }
  CHANGE_EVENTS.forEach((eventName) => window.on(eventName as 'resize', saveSoon))
  window.on('close', () => {
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
    }
    saveWindowState(window, normalBounds)
  })
}
