import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

export interface RunningApp {
  application: ElectronApplication
  window: Page
  projectFolder: string
  close: () => Promise<void>
}

const PROJECT_ROOT = resolve(__dirname, '..')

export async function launchApp(): Promise<RunningApp> {
  const workFolder = await mkdtemp(join(tmpdir(), 'o-bros-e2e-'))
  const projectFolder = join(workFolder, 'sample-project')
  const userDataFolder = join(workFolder, 'user-data')

  await mkdir(projectFolder)
  await mkdir(userDataFolder)
  await writeFile(join(projectFolder, 'notes.txt'), 'first line\n', 'utf8')
  await writeFile(join(userDataFolder, 'settings.json'), JSON.stringify({ projectRoots: [projectFolder] }), 'utf8')

  const environment = { ...process.env }
  delete environment.ELECTRON_RENDERER_URL

  const application = await electron.launch({
    args: [PROJECT_ROOT, `--user-data-dir=${userDataFolder}`],
    env: environment as Record<string, string>
  })
  const window = await application.firstWindow()
  await window.waitForSelector('.rail')

  return {
    application,
    window,
    projectFolder,
    close: async () => {
      await application.close()
      await rm(workFolder, { recursive: true, force: true })
    }
  }
}
