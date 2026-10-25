import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { devServerUrl, isRunningFromSource } from './runMode'
import { writeLog } from './services/logging/logFile'
import { showWithSavedState } from './windowState'

const TITLE_BAR_HEIGHT = 36
const CLEAR_COLOR = '#00000000'
const CHROME_COLOR = '#0B0B0B'
const TEXT_COLOR = '#EDEDED'
const TERMINAL_COLOR = '#000000'
const WEB_PROTOCOLS = ['https:', 'http:']
const DEFAULT_SIZE = { width: 1440, height: 900 }
const MINIMUM_SIZE = { width: 900, height: 560 }

function isWebLink(url: string): boolean {
  try {
    return WEB_PROTOCOLS.includes(new URL(url).protocol)
  } catch {
    return false
  }
}

export function showTitleBarSeeThrough(window: BrowserWindow, isSeeThrough: boolean): void {
  if (process.platform !== 'win32') {
    return
  }
  window.setTitleBarOverlay({ color: isSeeThrough ? CLEAR_COLOR : CHROME_COLOR, symbolColor: TEXT_COLOR, height: TITLE_BAR_HEIGHT })
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    ...DEFAULT_SIZE,
    show: false,
    minWidth: MINIMUM_SIZE.width,
    minHeight: MINIMUM_SIZE.height,
    backgroundColor: TERMINAL_COLOR,
    icon: join(__dirname, '../../resources/logo.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: CHROME_COLOR, symbolColor: TEXT_COLOR, height: TITLE_BAR_HEIGHT },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false,
      devTools: isRunningFromSource()
    }
  })

  showWithSavedState(window, MINIMUM_SIZE)

  window.webContents.setWindowOpenHandler(({ url }) => {
    if (isWebLink(url)) {
      void shell.openExternal(url)
    }
    return { action: 'deny' }
  })
  window.webContents.on('will-navigate', (event, url) => {
    if (url !== window.webContents.getURL()) {
      event.preventDefault()
    }
  })
  window.webContents.on('render-process-gone', (_event, details) => {
    writeLog('error', 'The interface process stopped: ' + details.reason)
  })

  const sourceUrl = devServerUrl()
  if (sourceUrl !== null) {
    void window.loadURL(sourceUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
