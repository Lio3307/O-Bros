import { expect, test } from '@playwright/test'
import { execFile } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { launchApp, type RunningApp } from './launchApp'

const execFileAsync = promisify(execFile)

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

async function git(...args: string[]): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd: app.projectFolder })
  return stdout
}

async function writeNotes(text: string): Promise<void> {
  await writeFile(join(app.projectFolder, 'notes.txt'), text, 'utf8')
}

async function startConflictingMerge(): Promise<void> {
  await git('init', '-b', 'main')
  await git('config', 'user.name', 'Test')
  await git('config', 'user.email', 'test@example.com')
  await writeNotes('shared line\n')
  await git('add', 'notes.txt')
  await git('commit', '-m', 'Start')
  await git('switch', '-c', 'feature-x')
  await writeNotes('line from feature\n')
  await git('commit', '-am', 'Feature change')
  await git('switch', 'main')
  await writeNotes('line from main\n')
  await git('commit', '-am', 'Main change')
  await git('merge', 'feature-x').catch(() => undefined)
}

async function openChanges(): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
}

test('shows a merge conflict, takes the incoming version and commits the merge', async () => {
  await startConflictingMerge()
  await openChanges()

  const banner = app.window.locator('.conflict-banner')
  await expect(banner).toContainText('Merging feature-x', { timeout: 15_000 })
  await expect(banner).toContainText('1 file has conflicts.')
  await expect(banner.getByRole('button', { name: 'Commit merge' })).toBeDisabled()

  const conflict = app.window.locator('.conflict-item', { hasText: 'notes.txt' })
  await conflict.getByRole('button', { name: 'Use incoming' }).click()

  await expect(banner).toContainText('All conflicts are resolved.', { timeout: 15_000 })
  await banner.getByRole('button', { name: 'Commit merge' }).click()

  await expect(banner).toHaveCount(0, { timeout: 15_000 })
  expect(await readFile(join(app.projectFolder, 'notes.txt'), 'utf8')).toContain('line from feature')
  expect(await git('log', '-1', '--format=%P')).toContain(' ')
})

test('refuses to mark a file resolved while it still has conflict markers, then aborts the merge', async () => {
  await startConflictingMerge()
  await openChanges()

  const conflict = app.window.locator('.conflict-item', { hasText: 'notes.txt' })
  await conflict.getByRole('button', { name: 'Mark resolved' }).click({ timeout: 15_000 })
  await expect(app.window.locator('.toast-error')).toContainText('still has conflict markers', { timeout: 15_000 })
  await expect(conflict).toBeVisible()

  await app.window.locator('.conflict-banner').getByRole('button', { name: 'Abort' }).click()
  await app.window.getByRole('button', { name: 'Cancel it' }).click()

  await expect(app.window.locator('.conflict-banner')).toHaveCount(0, { timeout: 15_000 })
  expect(await readFile(join(app.projectFolder, 'notes.txt'), 'utf8')).toContain('line from main')
})
