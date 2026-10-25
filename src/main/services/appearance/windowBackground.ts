import type { BrowserWindow } from 'electron'
import type { WindowBackground } from '../../../shared/appearance'
import { showTitleBarSeeThrough } from '../../window'

export function applyWindowBackground(window: BrowserWindow, background: WindowBackground): void {
  if (process.platform !== 'win32') {
    return
  }
  showTitleBarSeeThrough(window, background.isSeeThrough)
  window.setBackgroundColor(background.isDesktop ? '#00000000' : '#000000')
  window.setBackgroundMaterial(background.isDesktop ? 'acrylic' : 'none')
}
