import { BrowserWindow, shell } from 'electron'
import { join } from 'node:path'
import { writeLog } from './services/logging/logFile'

const TITLE_BAR_HEIGHT = 36
const CHROME_COLOR = '#0B0B0B'
const TEXT_COLOR = '#EDEDED'
const TERMINAL_COLOR = '#000000'
const WEB_PROTOCOLS = ['https:', 'http:']

function isWebLink(url: string): boolean {
  try {
    return WEB_PROTOCOLS.includes(new URL(url).protocol)
  } catch {
    return false
  }
}

export function createMainWindow(): BrowserWindow {
  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 560,
    backgroundColor: TERMINAL_COLOR,
    icon: join(__dirname, '../../resources/logo.png'),
    titleBarStyle: 'hidden',
    titleBarOverlay: { color: CHROME_COLOR, symbolColor: TEXT_COLOR, height: TITLE_BAR_HEIGHT },
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      spellcheck: false
    }
  })

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

  const devServerUrl = process.env.ELECTRON_RENDERER_URL
  if (devServerUrl !== undefined) {
    void window.loadURL(devServerUrl)
  } else {
    void window.loadFile(join(__dirname, '../renderer/index.html'))
  }

  return window
}
