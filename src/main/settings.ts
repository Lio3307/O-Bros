import { app } from 'electron'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { readJsonIfExists } from './services/fileSystem'

interface Settings {
  projectRoots: string[]
}

function settingsFilePath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

export async function loadSettings(): Promise<Settings> {
  const saved = await readJsonIfExists<Partial<Settings>>(settingsFilePath())
  return { projectRoots: saved?.projectRoots ?? [] }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await mkdir(dirname(settingsFilePath()), { recursive: true })
  await writeFile(settingsFilePath(), JSON.stringify(settings, null, 2), 'utf8')
}
