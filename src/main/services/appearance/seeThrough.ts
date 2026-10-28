import type { BrowserWindow } from 'electron'
import { release } from 'node:os'

const FIRST_WINDOWS_BUILD_WITH_ACRYLIC = 22621

function windowsBuild(): number {
  return Number(release().split('.')[2] ?? 0)
}

export function canSeeThrough(): boolean {
  if (process.platform === 'darwin') {
    return true
  }
  return process.platform === 'win32' && windowsBuild() >= FIRST_WINDOWS_BUILD_WITH_ACRYLIC
}

export function showWhatIsBehind(window: BrowserWindow, isShown: boolean): void {
  if (!canSeeThrough()) {
    return
  }
  if (process.platform === 'darwin') {
    window.setVibrancy(isShown ? 'under-window' : null)
    return
  }
  window.setBackgroundMaterial(isShown ? 'acrylic' : 'none')
}
