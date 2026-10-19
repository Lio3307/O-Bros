import { expect, test } from '@playwright/test'
import { execFile } from 'node:child_process'
import { mkdir, writeFile } from 'node:fs/promises'
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

async function git(...args: string[]): Promise<void> {
  await execFileAsync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
    cwd: app.projectFolder
  })
}

async function createRepositoryWithTwoCommits(): Promise<void> {
  await git('init')
  await git('add', 'notes.txt')
  await git('commit', '-m', 'First commit')
  await writeFile(join(app.projectFolder, 'notes.txt'), 'first line\nsecond line added later\n', 'utf8')
  await git('add', 'notes.txt')
  await git('commit', '-m', 'Second commit')
}

test('lists the commits of the repository and shows the diff of a commit file', async () => {
  await createRepositoryWithTwoCommits()

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()

  await expect(app.window.getByText('Second commit', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(app.window.getByText('First commit', { exact: true })).toBeVisible()

  await app.window.getByText('Second commit', { exact: true }).click()
  await app.window.locator('.commit-files .row', { hasText: 'notes.txt' }).click()

  await expect(app.window.locator('.diff-row', { hasText: 'second line added later' })).toBeVisible({
    timeout: 15_000
  })
})

test('picks a nested repository from a folder of repositories and goes back to the list', async () => {
  const groupFolder = join(app.projectFolder, 'group')
  const nestedRepository = join(groupFolder, 'service')
  await mkdir(nestedRepository, { recursive: true })
  await writeFile(join(nestedRepository, 'readme.txt'), 'nested\n', 'utf8')
  const gitIn = (...args: string[]) =>
    execFileAsync('git', ['-c', 'user.name=Test', '-c', 'user.email=test@example.com', ...args], {
      cwd: nestedRepository
    })
  await gitIn('init')
  await gitIn('add', 'readme.txt')
  await gitIn('commit', '-m', 'Nested commit')

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()

  await expect(app.window.getByText('Repositories in this folder')).toBeVisible({ timeout: 15_000 })
  await expect(app.window.getByText('group/service', { exact: true })).toHaveCount(0)
  await app.window.locator('.repository-row', { hasText: '1 repository' }).getByText('group', { exact: true }).click()
  await expect(app.window.locator('.folder-overview-name')).toHaveText('group', { timeout: 15_000 })
  await app.window.locator('.repository-row').getByText('service', { exact: true }).click()

  await expect(app.window.getByText('Nested commit', { exact: true })).toBeVisible({ timeout: 15_000 })

  await app.window.locator('.changes-back', { hasText: 'group' }).click()
  await expect(app.window.locator('.folder-overview-name')).toHaveText('group', { timeout: 15_000 })
  await app.window.locator('.changes-back', { hasText: 'sample-project' }).click()
  await expect(app.window.locator('.folder-overview-name')).toHaveText('sample-project', { timeout: 15_000 })
})

test('names the folder and lists its repositories in the main area when it is not a repository', async () => {
  const nestedRepository = join(app.projectFolder, 'group', 'service')
  await mkdir(nestedRepository, { recursive: true })
  await execFileAsync('git', ['init'], { cwd: nestedRepository })
  const errorOutput: string[] = []
  app.application.process().stderr?.on('data', (chunk: Buffer) => errorOutput.push(chunk.toString()))

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()

  const overview = app.window.locator('.folder-overview')
  await expect(overview).toContainText('sample-project', { timeout: 15_000 })
  await expect(overview).toContainText(app.projectFolder)
  await expect(overview).toContainText('This folder is not a git repository.')
  await expect(overview.locator('.repository-row', { hasText: 'group' })).toContainText('1 repository')
  await expect(overview).toHaveCSS('overflow-y', 'auto')
  await app.window.waitForTimeout(1000)
  expect(errorOutput.join('')).not.toContain('git:stashList')
})

test('shows the commit graph in the main area and opens a commit file from it', async () => {
  await createRepositoryWithTwoCommits()

  await app.window.getByTitle('Changes', { exact: true }).waitFor()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await expect(app.window.getByText('Second commit', { exact: true })).toBeVisible({ timeout: 15_000 })

  await git('branch', 'feature-x')
  await app.window.getByTitle('Show the branch graph in the main area').click()

  await expect(app.window.locator('.graph-row')).toHaveCount(2, { timeout: 15_000 })
  await expect(app.window.locator('.commit-graph')).toHaveCount(2)

  await app.window.locator('.graph-branch-select').click()
  const branchOptions = app.window.locator('.popup-menu-item')
  await expect(branchOptions).toHaveCount(3)
  await branchOptions.filter({ hasText: 'feature-x' }).click()
  await expect(app.window.locator('.graph-branch-select')).toHaveText('feature-x')
  await app.window.locator('.graph-branch-select').click()
  await expect(app.window.locator('.popup-menu')).toBeVisible()
  await app.window.locator('.graph-branch-select').click()
  await expect(app.window.locator('.popup-menu')).toHaveCount(0)
  await expect(app.window.locator('.graph-row')).toHaveCount(2, { timeout: 15_000 })

  await app.window.locator('.graph-row', { hasText: 'Second commit' }).click()
  await app.window.locator('.graph-files .row', { hasText: 'notes.txt' }).click()

  await expect(app.window.locator('.diff-row', { hasText: 'second line added later' })).toBeVisible({
    timeout: 15_000
  })
})

test('stashes changes, applies the stash and pushes a commit to a remote', async () => {
  const remotePath = join(app.projectFolder, '..', 'remote.git')
  await mkdir(remotePath)
  await execFileAsync('git', ['init', '--bare', '--initial-branch=main'], { cwd: remotePath })
  await git('init', '--initial-branch=main')
  await git('add', 'notes.txt')
  await git('commit', '-m', 'First commit')
  await git('remote', 'add', 'origin', remotePath)
  await git('push', '--set-upstream', 'origin', 'main')
  await writeFile(join(app.projectFolder, 'notes.txt'), 'first line\nlocal edit\n', 'utf8')

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await expect(app.window.getByText('1 files')).toBeVisible({ timeout: 15_000 })

  await app.window.getByRole('button', { name: 'Stash changes' }).click()
  await expect(app.window.getByText('No changes. Your files match the last commit.')).toBeVisible({ timeout: 15_000 })
  await expect(app.window.getByRole('button', { name: 'Apply' })).toBeVisible()

  await app.window.getByRole('button', { name: 'Apply' }).click()
  await expect(app.window.getByText('1 files')).toBeVisible({ timeout: 15_000 })

  await git('add', 'notes.txt')
  await git('commit', '-m', 'Local commit')
  await app.window.getByTitle('Fetch from the remote').click()
  await expect(app.window.getByRole('button', { name: /Push 1/ })).toBeVisible({ timeout: 15_000 })

  await app.window.getByRole('button', { name: /Push 1/ }).click()
  await expect(app.window.getByText('Up to date')).toBeVisible({ timeout: 15_000 })
})

test('creates a branch, renames it, then undoes the last commit', async () => {
  await createRepositoryWithTwoCommits()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await expect(app.window.getByText('Second commit', { exact: true })).toBeVisible({ timeout: 15_000 })
  await expect(app.window.getByPlaceholder('Stage changes to write a commit message')).toBeDisabled()
  await expect(app.window.getByRole('button', { name: 'Nothing staged' })).toBeDisabled()

  await app.window.getByTitle('Branch and commit actions').click()
  await app.window.getByText('New branch…', { exact: true }).click()
  await app.window.getByPlaceholder('feature/my-change').fill('feature/ui')
  await app.window.getByRole('button', { name: 'Create branch' }).click()
  await expect(app.window.locator('.branch-switch', { hasText: 'feature/ui' })).toBeVisible({ timeout: 15_000 })

  await app.window.getByTitle('Branch and commit actions').click()
  await app.window.getByText('Rename "feature/ui"…', { exact: true }).click()
  await app.window.getByPlaceholder('New name').fill('feature/ui-v2')
  await app.window.getByRole('button', { name: 'Rename' }).click()
  await expect(app.window.locator('.branch-switch', { hasText: 'feature/ui-v2' })).toBeVisible({ timeout: 15_000 })

  await app.window.getByTitle('Branch and commit actions').click()
  await app.window.getByText('Undo last commit', { exact: true }).click()
  await app.window.getByRole('button', { name: 'Undo commit' }).click()

  await expect(app.window.getByText('Second commit', { exact: true })).toHaveCount(0, { timeout: 15_000 })
  await expect(app.window.getByText('First commit', { exact: true })).toBeVisible()
  await expect(app.window.getByText('Staged', { exact: true })).toBeVisible()
  await expect(app.window.getByPlaceholder('Commit message', { exact: true })).toBeEnabled()
})

test('shows a changed file side by side, before on the left and after on the right', async () => {
  await createRepositoryWithTwoCommits()
  await writeFile(join(app.projectFolder, 'notes.txt'), 'first line\nsecond line rewritten\n' + 'more\n'.repeat(300) + 'x'.repeat(2000) + '\n', 'utf8')

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Changes', { exact: true }).click()
  await app.window.locator('.row-change', { hasText: 'notes.txt' }).click()
  await expect(app.window.locator('.diff-row', { hasText: 'second line rewritten' })).toBeVisible({ timeout: 15_000 })

  await app.window.getByRole('button', { name: 'Side by side' }).click()
  const [beforeColumn, afterColumn] = [app.window.locator('.diff-split-column').first(), app.window.locator('.diff-split-column').last()]
  const removedCell = beforeColumn.locator('.diff-half', { hasText: 'second line added later' })
  const addedCell = afterColumn.locator('.diff-half', { hasText: 'second line rewritten' })
  await expect(removedCell).toHaveClass(/diff-cell-removed/)
  await expect(addedCell).toHaveClass(/diff-cell-added/)
  await expect(removedCell.locator('.diff-number')).toHaveText('2')
  expect(await removedCell.evaluate((element) => (element as HTMLElement).offsetTop)).toBe(await addedCell.evaluate((element) => (element as HTMLElement).offsetTop))
  await expect(app.window.locator('.diff-split-head')).toContainText('Before')

  const scrolled = await afterColumn.evaluate((element) => {
    element.scrollTop = element.scrollHeight
    element.scrollLeft = element.scrollWidth
    return { top: element.scrollTop, left: element.scrollLeft, height: element.clientHeight }
  })
  expect(scrolled.top).toBeGreaterThan(0)
  expect(scrolled.left).toBeGreaterThan(0)
  expect(scrolled.height).toBeLessThan(await app.window.evaluate(() => window.innerHeight))
  await expect.poll(() => beforeColumn.evaluate((element) => element.scrollTop)).toBe(scrolled.top)
})
