import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
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
    data.setData('application/x-obros-path', JSON.stringify([path]))
    element.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }))
  }, otherFile)

  await expect(app.window.locator('.tab-active')).toContainText('other.txt')
  await expect(editor).toContainText('text of the other file')
  expect(await readFile(join(app.projectFolder, 'notes.txt'), 'utf8')).toBe('first line\n')
})

test('ctrl-clicked files and folders from the tree drop on a terminal together, quoted when needed', async () => {
  app = await launchApp()
  await mkdir(join(app.projectFolder, 'my folder'))
  await writeFile(join(app.projectFolder, 'my folder', 'inside.txt'), 'x', 'utf8')
  await writeFile(join(app.projectFolder, 'second.txt'), 'x', 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.waitForTimeout(2500)
  await app.window.getByTitle('Toggle files panel').click()
  const filesPanel = app.window.locator('.files-panel')
  const folderRow = filesPanel.locator('.row', { hasText: 'my folder' })
  const fileRow = filesPanel.locator('.row', { hasText: 'second.txt' })
  await expect(fileRow).toBeVisible({ timeout: LIVE_TIMEOUT_MS })
  await folderRow.click({ modifiers: ['Control'] })
  await fileRow.click({ modifiers: ['Control'] })
  await expect(filesPanel.locator('.row-picked')).toHaveCount(2)

  await app.window.locator('.xterm-helper-textarea').first().focus()
  await app.window.keyboard.type('Write-Output ')
  await app.window.evaluate(() => {
    const data = new DataTransfer()
    const row = Array.from(document.querySelectorAll('.files-panel .row')).find((element) => element.textContent?.includes('second.txt'))!
    row.dispatchEvent(new DragEvent('dragstart', { dataTransfer: data, bubbles: true }))
    const host = document.querySelector('.terminal-host')!
    host.dispatchEvent(new DragEvent('dragover', { dataTransfer: data, bubbles: true, cancelable: true }))
    host.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }))
  })
  await app.window.keyboard.type('> dropped.txt')
  await app.window.keyboard.press('Enter')

  const output = join(app.projectFolder, 'dropped.txt')
  await expect.poll(() => readFile(output, 'utf16le').catch(() => ''), { timeout: 20_000 }).toContain('second.txt')
  const lines = (await readFile(output, 'utf16le')).split('\n').map((line) => line.trim().replace('﻿', '')).filter((line) => line !== '')
  expect(lines).toEqual([join(app.projectFolder, 'my folder'), join(app.projectFolder, 'second.txt')])
  await expect(filesPanel.locator('.row-picked')).toHaveCount(0)
})

test('folders dropped on Projects become projects, a file is refused and a known project is selected', async () => {
  app = await launchApp()
  const newProject = join(dirname(app.projectFolder), 'dropped-app')
  const strayFile = join(dirname(app.projectFolder), 'readme.md')
  await mkdir(newProject)
  await writeFile(strayFile, '# hi', 'utf8')
  const dropOnProjects = (paths: string[], dropIt: boolean) =>
    app.window.evaluate(
      ([dropped, shouldDrop]) => {
        const data = new DataTransfer()
        data.setData('application/x-obros-path', JSON.stringify(dropped))
        const panel = document.querySelector('.projects-drop-zone')!
        panel.dispatchEvent(new DragEvent('dragover', { dataTransfer: data, bubbles: true, cancelable: true }))
        if (shouldDrop) {
          panel.dispatchEvent(new DragEvent('drop', { dataTransfer: data, bubbles: true, cancelable: true }))
        }
      },
      [paths, dropIt] as const
    )

  await dropOnProjects([newProject], false)
  await expect(app.window.getByText('Drop folders to add them as projects')).toBeVisible()
  if (process.env.APPEARANCE_SHOTS !== undefined) {
    await app.window.screenshot({ path: `${process.env.APPEARANCE_SHOTS}/projects-drop.png` })
  }
  await dropOnProjects([newProject, strayFile, app.projectFolder], true)
  await expect(app.window.getByText('Drop folders to add them as projects')).toHaveCount(0)
  await expect(app.window.locator('.root-header').getByTitle(newProject, { exact: true })).toBeVisible()
  await expect(app.window.getByText('"readme.md" is a file. Drop a folder to add it as a project.')).toBeVisible()
  await expect(app.window.getByText('"sample-project" is already in your sidebar. It is selected now.')).toBeVisible()
  await expect(app.window.locator('.root-header')).toHaveCount(2)
})
