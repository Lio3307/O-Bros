import { app } from 'electron'
import { readFileSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { readJsonIfExists } from './services/fileSystem'

interface Settings {
  projectRoots: string[]
  useHardwareAcceleration: boolean
  conversationFolder: string | null
}

function settingsFilePath(): string {
  return join(app.getPath('userData'), 'settings.json')
}

function withDefaults(saved: Partial<Settings> | null): Settings {
  return {
    projectRoots: saved?.projectRoots ?? [],
    useHardwareAcceleration: saved?.useHardwareAcceleration !== false,
    conversationFolder: typeof saved?.conversationFolder === 'string' ? saved.conversationFolder : null
  }
}

export async function loadSettings(): Promise<Settings> {
  return withDefaults(await readJsonIfExists<Partial<Settings>>(settingsFilePath()))
}

export function loadSettingsBeforeStart(): Settings {
  try {
    return withDefaults(JSON.parse(readFileSync(settingsFilePath(), 'utf8')) as Partial<Settings>)
  } catch {
    return withDefaults(null)
  }
}

export async function saveSettings(settings: Settings): Promise<void> {
  await mkdir(dirname(settingsFilePath()), { recursive: true })
  await writeFile(settingsFilePath(), JSON.stringify(settings, null, 2), 'utf8')
}
