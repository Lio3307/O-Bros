import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

const FILE_COUNT = 1200
const BRANCH_COUNT = 300

function git(...args: string[]): string {
  return execFileSync('git', ['-c', 'user.name=T', '-c', 'user.email=t@e.c', ...args], { cwd: app.projectFolder }).toString().trim()
}

async function plantBigRepository(): Promise<void> {
  git('init')
  git('add', '.')
  git('commit', '-m', 'first')
  const head = git('rev-parse', 'HEAD')
  await mkdir(join(app.projectFolder, '.git', 'refs', 'heads', 'b'), { recursive: true })
  await Promise.all(Array.from({ length: BRANCH_COUNT }, (_, index) => writeFile(join(app.projectFolder, '.git', 'refs', 'heads', 'b', String(index)), `${head}\n`)))
  const folder = join(app.projectFolder, 'bigfolder')
  await mkdir(folder)
  await Promise.all(Array.from({ length: FILE_COUNT }, (_, index) => writeFile(join(folder, `file-with-a-longer-name-${String(index).padStart(4, '0')}.txt`), 'x')))
}

async function openProject(): Promise<void> {
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click({ timeout: 5000 }).catch(() => undefined)
}

test('a folder with many files shows a batch at a time and nothing is out of reach', async () => {
  test.setTimeout(120_000)
  app = await launchApp({ separateHome: true })
  await plantBigRepository()
  await openProject()
  const panel = app.window.locator('.files-panel')
  if ((await panel.count()) === 0) {
    await app.window.getByTitle('Toggle files panel').click()
  }
  await panel.getByText('bigfolder', { exact: true }).click()
  await expect(panel.locator('[data-path$=".txt"]').filter({ hasText: 'file-with' })).toHaveCount(500, { timeout: 30_000 })
  await panel.getByRole('button', { name: 'Show 500 more (700 not shown)' }).click()
  await expect(panel.locator('[data-path$=".txt"]').filter({ hasText: 'file-with' })).toHaveCount(1000)
  await panel.getByRole('button', { name: 'Show 200 more (200 not shown)' }).click()
  await expect(panel.locator('[data-path$=".txt"]').filter({ hasText: 'file-with' })).toHaveCount(FILE_COUNT)
  await expect(panel.locator('.show-more-row')).toHaveCount(0)
})

test('Stage all reaches every file, even past the rows shown and the command length limit', async () => {
  test.setTimeout(180_000)
  app = await launchApp({ separateHome: true })
  await plantBigRepository()
  git('config', 'status.showUntrackedFiles', 'all')
  await openProject()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await expect(app.window.locator('.row-change')).toHaveCount(500, { timeout: 60_000 })
  await expect(app.window.getByRole('button', { name: 'Show 500 more (700 not shown)' })).toBeVisible()
  await app.window.getByRole('button', { name: 'Stage all' }).click()
  await expect.poll(() => git('diff', '--cached', '--name-only').split('\n').length, { timeout: 90_000 }).toBe(FILE_COUNT)
  await app.window.getByRole('button', { name: 'Unstage all' }).click()
  await expect.poll(() => git('diff', '--cached', '--name-only'), { timeout: 90_000 }).toBe('')
})

test('the branch switcher shows the first branches and search finds the rest', async () => {
  app = await launchApp({ separateHome: true })
  await plantBigRepository()
  await openProject()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await app.window.locator('.branch-switch').click({ timeout: 30_000 })
  await expect(app.window.getByRole('option')).toHaveCount(200, { timeout: 15_000 })
  await expect(app.window.getByText(`Showing the first 200 of ${BRANCH_COUNT + 1}. Type to find the rest.`)).toBeVisible()
  await app.window.getByRole('combobox').fill('b/299')
  await expect(app.window.getByRole('option')).toHaveCount(1)
  await expect(app.window.getByRole('option')).toContainText('b/299')
})
