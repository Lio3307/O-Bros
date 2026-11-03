import { expect, test } from '@playwright/test'
import { execFileSync } from 'node:child_process'
import { mkdir, rm, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.APPEARANCE_SHOTS

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

function git(cwd: string, ...args: string[]): void {
  execFileSync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', '-c', 'init.defaultBranch=main', ...args], { cwd })
}

test('the Files panel says whether the folder is in git and marks new, changed and deleted files', async () => {
  app = await launchApp()
  const repo = join(app.projectFolder, 'app')
  await mkdir(join(repo, 'src'), { recursive: true })
  await mkdir(join(app.projectFolder, 'plain'))
  await writeFile(join(app.projectFolder, 'plain', 'readme.txt'), 'no git here\n', 'utf8')
  await writeFile(join(repo, 'src', 'main.ts'), 'export const a = 1\n', 'utf8')
  await writeFile(join(repo, 'src', 'old.ts'), 'export const old = 1\n', 'utf8')
  await writeFile(join(repo, 'readme.md'), '# App\n', 'utf8')
  git(repo, 'init')
  git(repo, 'add', '.')
  git(repo, 'commit', '-m', 'First')
  await writeFile(join(repo, 'src', 'main.ts'), 'export const a = 2\n', 'utf8')
  await rm(join(repo, 'src', 'old.ts'))
  await writeFile(join(repo, 'src', 'draft.ts'), 'export const draft = 1\n', 'utf8')
  await writeFile(join(repo, 'staged.ts'), 'export const staged = 1\n', 'utf8')
  git(repo, 'add', 'staged.ts')

  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await app.window.getByTitle(repo, { exact: true }).click()
  await app.window.getByTitle('Toggle files panel').click()
  const panel = app.window.locator('.files-panel')
  await expect(panel.locator('.files-git')).toContainText('main', { timeout: 15_000 })
  await expect(panel.locator('.files-git')).toContainText('4 changes')

  const sourceFolder = panel.locator('.row', { hasText: 'src' })
  await expect(sourceFolder.locator('.git-dot')).toHaveClass(/git-deleted/)
  expect(await sourceFolder.locator('.tree-name').evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe('none')
  await expect(panel.locator('.row', { hasText: 'staged.ts' }).locator('.git-letter')).toHaveText('A')
  await expect(panel.locator('.row', { hasText: 'readme.md' }).locator('.git-letter')).toHaveCount(0)

  await sourceFolder.click()
  await expect(panel.locator('.row', { hasText: 'main.ts' }).locator('.git-letter')).toHaveText('M')
  await expect(panel.locator('.row', { hasText: 'main.ts' }).locator('.tree-name')).toHaveClass(/git-modified/)
  await expect(panel.locator('.row', { hasText: 'draft.ts' }).locator('.git-letter')).toHaveText('U')
  const deletedRow = panel.locator('.row-deleted', { hasText: 'old.ts' })
  await expect(deletedRow.locator('.git-letter')).toHaveText('D')
  expect(await deletedRow.locator('.tree-name').evaluate((element) => getComputedStyle(element).textDecorationLine)).toBe('line-through')
  if (SHOTS !== undefined) {
    await panel.screenshot({ path: `${SHOTS}/files-git.png` })
  }

  git(repo, 'add', '-A')
  git(repo, 'commit', '-m', 'Second')
  await expect(panel.locator('.files-git')).toContainText('no changes', { timeout: 20_000 })
  await expect(panel.locator('.git-letter')).toHaveCount(0)
  await expect(panel.locator('.row-deleted')).toHaveCount(0)

  await app.window.getByTitle(join(app.projectFolder, 'plain'), { exact: true }).click()
  await expect(panel.locator('.files-git')).toHaveText('No git', { timeout: 15_000 })
})

test('the Files panel shows the folder of the terminal in use, not only the project', async () => {
  app = await launchApp()
  const subfolder = join(app.projectFolder, 'app')
  await mkdir(subfolder)
  await writeFile(join(subfolder, 'inside.txt'), 'inside\n', 'utf8')
  await app.window.reload()
  await app.window.waitForSelector('.rail')

  await app.window.getByTitle(subfolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.locator('.tab', { hasText: 'app' }).click()
  await app.window.getByTitle('Toggle files panel').click()
  const panel = app.window.locator('.files-panel')
  await expect(panel.locator('.panel-title')).toHaveText('app')
  await expect(panel.locator('.row', { hasText: 'inside.txt' })).toBeVisible()

  await panel.locator('.row', { hasText: 'inside.txt' }).click()
  await expect(app.window.locator('.tab', { hasText: 'inside.txt' })).toHaveClass(/tab-active/)
  await expect(panel.locator('.panel-title')).toHaveText('app')

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await expect(panel.locator('.panel-title')).toHaveText('sample-project')
})
