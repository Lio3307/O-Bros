import { app } from 'electron'

const DATA_FOLDER_NAME = 'o-bros'
const SOURCE_DATA_FOLDER_NAME = 'o-bros-dev'

export function isRunningFromSource(): boolean {
  return !app.isPackaged
}

export function dataFolderName(): string {
  return isRunningFromSource() ? SOURCE_DATA_FOLDER_NAME : DATA_FOLDER_NAME
}

export function devServerUrl(): string | null {
  return isRunningFromSource() ? (process.env.ELECTRON_RENDERER_URL ?? null) : null
}
