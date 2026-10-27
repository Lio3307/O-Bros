import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const LIVE_TIMEOUT_MS = 15_000

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('shows an arrow only where there is something to open', async () => {
  app = await launchApp()
  const rootHeader = app.window.locator('.root-header')
  await expect(rootHeader.getByText('sample-project', { exact: true })).toBeVisible()
  await expect(rootHeader.getByTitle('Show or hide folders')).toHaveCount(0)

  await mkdir(join(app.projectFolder, 'empty-folder'))
  await mkdir(join(app.projectFolder, 'src'))
  await writeFile(join(app.projectFolder, 'src', 'index.ts'), 'export {}\n', 'utf8')
  await expect(rootHeader.getByTitle('Show or hide folders')).toHaveCount(1, { timeout: LIVE_TIMEOUT_MS })

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Toggle files panel').click()
  const filesPanel = app.window.locator('.files-panel')
  const emptyRow = filesPanel.locator('.row', { hasText: 'empty-folder' })
  const sourceRow = filesPanel.locator('.row', { hasText: 'src' })
  await expect(emptyRow).toBeVisible({ timeout: LIVE_TIMEOUT_MS })
  await expect(emptyRow.locator('.disclosure-chevron')).toHaveCount(0)
  await expect(sourceRow.locator('.disclosure-chevron')).toHaveCount(1)
  await sourceRow.click()
  await expect(filesPanel.getByText('index.ts', { exact: true })).toBeVisible()
})

test('a file dropped on the editor opens in its own tab instead of being pasted into the open file', async () => {
  app = await launchApp()
  const otherFile = join(app.projectFolder, 'other.txt')
  await writeFile(otherFile, 'text of the other file\n', 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('notes')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  const editor = app.window.locator('.cm-content')
  await expect(editor).toContainText('first line')

  await editor.evaluate((element, path) => {
    const data = new DataTransfer()
    data.setData('application/x-obros-path', path)
    element.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }))
  }, otherFile)

  await expect(app.window.locator('.tab-active')).toContainText('other.txt')
  await expect(editor).toContainText('text of the other file')
  expect(await readFile(join(app.projectFolder, 'notes.txt'), 'utf8')).toBe('first line\n')
})
