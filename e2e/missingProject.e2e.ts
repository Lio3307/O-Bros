import { expect, test } from '@playwright/test'
import { mkdir, mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp
let goneParent: string
let gonePath: string

test.beforeEach(async () => {
  goneParent = join(tmpdir(), `o-bros-gone-${Date.now()}`)
  gonePath = join(goneParent, 'my-app')
  app = await launchApp({ settings: { projectRoots: [gonePath] } })
})

test.afterEach(async () => {
  await app.close()
  await rm(goneParent, { recursive: true, force: true })
})

function missingNotice() {
  return app.window.locator('.missing-root-notice')
}

test('marks a project folder that is gone and explains it in a new terminal', async () => {
  await expect(missingNotice()).toContainText('Folder not found')

  await app.window.getByTitle(gonePath, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await expect(app.window.locator('.xterm-rows').last()).toContainText('This folder is not available', { timeout: 5000 })

  await app.window.locator('.rail').getByTitle('Changes', { exact: false }).first().click()
  await expect(app.window.locator('.folder-overview')).toContainText('This folder is not available')
  await expect(app.window.getByText('No repositories were found')).toHaveCount(0)
})

test('shows the folder again by itself when it is back', async () => {
  await expect(missingNotice()).toBeVisible()

  await mkdir(join(gonePath, 'web'), { recursive: true })
  await app.window.evaluate(() => window.dispatchEvent(new Event('focus')))

  await expect(missingNotice()).toHaveCount(0)
  await expect(app.window.locator('.folder-row', { hasText: 'web' })).toBeVisible()
})

test('Locate points the project at the folder where it is now', async () => {
  const movedTo = await mkdtemp(join(tmpdir(), 'o-bros-moved-'))
  await mkdir(join(movedTo, 'api'))
  await app.application.evaluate(({ dialog }, chosen) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [chosen] })
  }, movedTo)

  await missingNotice().getByRole('button', { name: 'Locate…' }).click()

  await expect(missingNotice()).toHaveCount(0)
  await expect(app.window.getByTitle(movedTo, { exact: true })).toBeVisible()
  await expect(app.window.locator('.folder-row', { hasText: 'api' })).toBeVisible()
  await rm(movedTo, { recursive: true, force: true })
})

test('Remove takes the missing folder out of the sidebar', async () => {
  await missingNotice().getByRole('button', { name: 'Remove' }).click()

  await expect(app.window.getByTitle(gonePath, { exact: true })).toHaveCount(0)
})
