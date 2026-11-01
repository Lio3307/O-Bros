import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

const QUESTION = 'Do you trust this folder?'

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@e.c', ...args], { cwd, stdio: 'ignore' })
}

function marker(name: string): string {
  return join(app.projectFolder, '..', `RAN-${name}.txt`).split('\\').join('/')
}

async function plantGitTraps(): Promise<void> {
  const folder = app.projectFolder
  git(folder, 'init')
  git(folder, 'add', '.')
  git(folder, 'commit', '-m', 'first')
  git(folder, 'config', 'core.fsmonitor', `echo x > "${marker('fsmonitor')}"; exit 0; true`)
  git(folder, 'config', 'diff.external', `sh -c 'echo x > "${marker('diff')}"'`)
  git(folder, 'config', 'filter.evil.clean', `sh -c 'echo x > "${marker('filter')}"; cat'`)
  await writeFile(join(folder, '.gitattributes'), 'notes.txt filter=evil\n')
  await writeFile(join(folder, 'notes.txt'), 'changed\n')
}

async function plantLanguageServerTrap(): Promise<void> {
  const bin = join(app.projectFolder, 'node_modules', '.bin')
  await mkdir(bin, { recursive: true })
  const path = marker('server')
  await writeFile(join(bin, 'typescript-language-server.cmd'), `@echo x > "${path.split('/').join('\\')}"\r\n`)
  await writeFile(join(bin, 'typescript-language-server'), `#!/bin/sh\necho x > "${path}"\n`, { mode: 0o755 })
  await writeFile(join(app.projectFolder, 'bad.ts'), 'const x: number = "a"\n')
}

async function openFolder(): Promise<void> {
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  const isAlreadyAsking = await app.window.locator('.modal', { hasText: QUESTION }).isVisible()
  if (!isAlreadyAsking) {
    await app.window.getByTitle(app.projectFolder, { exact: true }).click({ timeout: 5000 }).catch(() => undefined)
  }
}

async function openFilesPanel(): Promise<ReturnType<RunningApp['window']['locator']>> {
  const panel = app.window.locator('.files-panel')
  if ((await panel.count()) === 0) {
    await app.window.getByTitle('Toggle files panel').click()
  }
  return panel
}

test('a booby-trapped folder runs nothing until the user trusts it, and works after', async () => {
  test.setTimeout(120_000)
  app = await launchApp({ separateHome: true, withoutProjectFolders: false })
  await plantGitTraps()
  await plantLanguageServerTrap()
  await openFolder()
  const dialog = app.window.locator('.modal', { hasText: QUESTION })
  await expect(dialog).toBeVisible({ timeout: 15_000 })
  await expect(dialog).toContainText('core.fsmonitor')
  await expect(dialog).toContainText('language server')
  await dialog.getByRole('button', { name: 'Keep it off' }).click()

  const panel = await openFilesPanel()
  await panel.getByText('bad.ts', { exact: true }).click()
  await app.window.waitForTimeout(3000)
  await app.window.getByTitle('Changes', { exact: true }).click()
  await expect(app.window.getByRole('button', { name: 'Trust this folder' })).toBeVisible({ timeout: 15_000 })
  await app.window.waitForTimeout(3000)
  await expect(app.window.getByText('No repositories were found')).toHaveCount(0)
  for (const name of ['fsmonitor', 'diff', 'filter', 'server']) {
    expect(existsSync(marker(name)), `${name} must not have run`).toBe(false)
  }

  await app.window.getByRole('button', { name: 'Trust this folder' }).click()
  await app.window.locator('.modal').getByRole('button', { name: 'Trust this folder' }).click()
  await expect(app.window.locator('.row-change', { hasText: 'notes.txt' }).first()).toBeVisible({ timeout: 15_000 })
  await expect.poll(() => existsSync(marker('fsmonitor')), { timeout: 15_000 }).toBe(true)
})

test('trust is remembered after a restart of the page, and only asked once', async () => {
  app = await launchApp({ separateHome: true })
  await plantGitTraps()
  await openFolder()
  const dialog = app.window.locator('.modal', { hasText: QUESTION })
  await dialog.getByRole('button', { name: 'Trust this folder' }).click({ timeout: 15_000 })
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await openFolder()
  await app.window.waitForTimeout(2000)
  await expect(dialog).toHaveCount(0)
})

test('other ways to hide git settings are caught too', async () => {
  test.setTimeout(90_000)
  app = await launchApp({ separateHome: true })
  const folder = app.projectFolder
  const elsewhere = join(folder, '..', 'real-git-folder')
  execFileSync('git', ['init', '--separate-git-dir', elsewhere, folder], { stdio: 'ignore' })
  await writeFile(join(elsewhere, 'config'), `[core] fsmonitor = "echo x > \\"${marker('link')}\\"; exit 0; true"\n`)
  await openFolder()
  const dialog = app.window.locator('.modal', { hasText: QUESTION })
  await expect(dialog, 'a .git file that points somewhere else').toContainText('core.fsmonitor', { timeout: 15_000 })
  await dialog.getByRole('button', { name: 'Keep it off' }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await app.window.waitForTimeout(3000)
  expect(existsSync(marker('link'))).toBe(false)
})

test('a folder laid out as a bare repository is caught', async () => {
  test.setTimeout(90_000)
  app = await launchApp({ separateHome: true })
  const folder = app.projectFolder
  await mkdir(join(folder, 'objects'))
  await mkdir(join(folder, 'refs'))
  await writeFile(join(folder, 'HEAD'), 'ref: refs/heads/main\n')
  await writeFile(join(folder, 'config'), `[core]\n\tbare = true\n\tfsmonitor = echo x > "${marker('bare')}"\n`)
  await openFolder()
  const dialog = app.window.locator('.modal', { hasText: QUESTION })
  await expect(dialog).toContainText('core.fsmonitor', { timeout: 15_000 })
  await dialog.getByRole('button', { name: 'Keep it off' }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await app.window.waitForTimeout(3000)
  expect(existsSync(marker('bare'))).toBe(false)
})

test('a normal repository is never asked about', async () => {
  app = await launchApp({ separateHome: true })
  git(app.projectFolder, 'init')
  git(app.projectFolder, 'add', '.')
  git(app.projectFolder, 'commit', '-m', 'first')
  git(app.projectFolder, 'config', 'user.name', 'Someone')
  await writeFile(join(app.projectFolder, 'notes.txt'), 'changed\n')
  await openFolder()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await expect(app.window.locator('.row-change', { hasText: 'notes.txt' }).first()).toBeVisible({ timeout: 15_000 })
  await expect(app.window.locator('.modal', { hasText: QUESTION })).toHaveCount(0)
})
