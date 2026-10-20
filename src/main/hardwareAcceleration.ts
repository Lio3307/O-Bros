import { app } from 'electron'
import { loadSettingsBeforeStart } from './settings'

let isOnThisRun = true

export function applyHardwareAccelerationSetting(): void {
  isOnThisRun = loadSettingsBeforeStart().useHardwareAcceleration
  if (!isOnThisRun) {
    app.disableHardwareAcceleration()
  }
}

export function isHardwareAccelerationOnThisRun(): boolean {
  return isOnThisRun
}
