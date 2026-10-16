import { _electron as electron, type ElectronApplication, type Page } from '@playwright/test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join, resolve } from 'node:path'

export interface RunningApp {
  application: ElectronApplication
  window: Page
  projectFolder: string
  homeFolder: string | null
  close: () => Promise<void>
}

const PROJECT_ROOT = resolve(__dirname, '..')

export interface LaunchOptions {
  separateHome?: boolean
  withoutProjectFolders?: boolean
  binFiles?: Record<string, string>
  extraArgs?: string[]
  settings?: Record<string, unknown>
  environment?: Record<string, string>
}

export async function launchApp(options: LaunchOptions = {}): Promise<RunningApp> {
  const workFolder = await mkdtemp(join(tmpdir(), 'o-bros-e2e-'))
  const projectFolder = join(workFolder, 'sample-project')
  const userDataFolder = join(workFolder, 'user-data')

  await mkdir(projectFolder)
  await mkdir(userDataFolder)
  await writeFile(join(projectFolder, 'notes.txt'), 'first line\n', 'utf8')
  await writeFile(join(userDataFolder, 'settings.json'), JSON.stringify({ projectRoots: options.withoutProjectFolders === true ? [] : [projectFolder], ...options.settings }), 'utf8')

  const environment: Record<string, string | undefined> = { ...process.env }
  const homeFolder = options.separateHome === true ? join(workFolder, 'home') : null
  if (homeFolder !== null) {
    await mkdir(homeFolder)
    environment.USERPROFILE = homeFolder
    environment.HOME = homeFolder
  }
  if (options.binFiles !== undefined) {
    const binFolder = join(workFolder, 'bin')
    await mkdir(binFolder)
    for (const [fileName, content] of Object.entries(options.binFiles)) {
      await writeFile(join(binFolder, fileName), content, { encoding: 'utf8', mode: 0o755 })
    }
    environment.PATH = `${binFolder}${delimiter}${environment.PATH ?? ''}`
    environment.Path = environment.PATH
  }
  Object.assign(environment, options.environment)
  delete environment.ELECTRON_RENDERER_URL

  const application = await electron.launch({
    args: [...(options.extraArgs ?? []), PROJECT_ROOT, `--user-data-dir=${userDataFolder}`],
    env: environment as Record<string, string>
  })
  const window = await application.firstWindow()
  await window.waitForSelector('.rail')

  return {
    application,
    window,
    projectFolder,
    homeFolder,
    close: async () => {
      await application.close()
      await rm(workFolder, { recursive: true, force: true })
    }
  }
}
