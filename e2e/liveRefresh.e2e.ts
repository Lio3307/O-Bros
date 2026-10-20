import { expect, test } from '@playwright/test'
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { launchApp, type RunningApp } from './launchApp'

const execFileAsync = promisify(execFile)
const LIVE_TIMEOUT_MS = 15_000

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

async function git(folder: string, ...args: string[]): Promise<void> {
  await execFileAsync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], { cwd: folder })
}

test('shows changes and new commits on the Git page without leaving it', async () => {
  await git(app.projectFolder, 'init', '-q', '--initial-branch=main')
  await git(app.projectFolder, 'add', 'notes.txt')
  await git(app.projectFolder, 'commit', '-q', '-m', 'First commit')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await expect(app.window.getByText('No changes. Your files match the last commit.')).toBeVisible({ timeout: LIVE_TIMEOUT_MS })

  await writeFile(join(app.projectFolder, 'made-by-agent.txt'), 'new\n', 'utf8')
  await expect(app.window.locator('.row-change', { hasText: 'made-by-agent.txt' })).toBeVisible({ timeout: LIVE_TIMEOUT_MS })

  await git(app.projectFolder, 'add', 'made-by-agent.txt')
  await git(app.projectFolder, 'commit', '-q', '-m', 'Commit from a terminal')
  await expect(app.window.getByText('Commit from a terminal', { exact: true })).toBeVisible({ timeout: LIVE_TIMEOUT_MS })
  await expect(app.window.getByText('No changes. Your files match the last commit.')).toBeVisible()
})

test('shows new files in the file tree and new folders and branches in Projects', async () => {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Toggle files panel').click()
  const filesPanel = app.window.locator('.files-panel')
  await expect(filesPanel.getByText('notes.txt', { exact: true })).toBeVisible({ timeout: LIVE_TIMEOUT_MS })

  await writeFile(join(app.projectFolder, 'created-outside.txt'), 'x', 'utf8')
  await expect(filesPanel.getByText('created-outside.txt', { exact: true })).toBeVisible({ timeout: LIVE_TIMEOUT_MS })

  const rootBlock = app.window.locator('.root-block')
  const service = join(app.projectFolder, 'cloned-service')
  await mkdir(service)
  await expect(rootBlock.getByText('cloned-service', { exact: true })).toBeVisible({ timeout: LIVE_TIMEOUT_MS })

  await writeFile(join(service, 'a.txt'), 'a', 'utf8')
  await git(service, 'init', '-q', '--initial-branch=main')
  await git(service, 'add', 'a.txt')
  await git(service, 'commit', '-q', '-m', 'start')
  await git(service, 'switch', '-q', '-c', 'feature-live')
  await expect(rootBlock.getByText('feature-live', { exact: true })).toBeVisible({ timeout: LIVE_TIMEOUT_MS })
})

test('finds deeper repositories after raising the search depth', async () => {
  const deepRepository = join(app.projectFolder, 'users', 'me', 'source', 'repos', 'deep-app')
  await mkdir(deepRepository, { recursive: true })
  await git(deepRepository, 'init', '-q')

  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Project folders' }).click()
  await app.window.getByRole('button', { name: '5 levels' }).click()

  await app.window.getByTitle('Projects', { exact: true }).click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await app.window.locator('.repository-switch').click()
  await expect(app.window.locator('.popup-menu-item', { hasText: 'deep-app' })).toBeVisible({ timeout: LIVE_TIMEOUT_MS })
})
