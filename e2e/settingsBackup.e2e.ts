import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp({ separateHome: true })
})

test.afterEach(async () => {
  await app.close()
})

async function answerSaveDialogWith(filePath: string): Promise<void> {
  await app.application.evaluate(({ dialog }, chosenPath) => {
    dialog.showSaveDialog = async () => ({ canceled: false, filePath: chosenPath })
  }, filePath)
}

async function answerOpenDialogWith(filePath: string): Promise<void> {
  await app.application.evaluate(({ dialog }, chosenPath) => {
    dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [chosenPath] })
  }, filePath)
}

async function openBackupPage(): Promise<void> {
  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Backup and restore' }).click()
}

test('exports settings to JSON and imports them back', async () => {
  await app.window.evaluate(() => {
    localStorage.setItem('o-bros.colorTheme', 'dracula')
    localStorage.setItem('o-bros.terminalFontSize', '15')
    localStorage.setItem('o-bros.session', '{"tabs":[]}')
  })
  const exportPath = join(app.projectFolder, 'exported-settings.json')
  await answerSaveDialogWith(exportPath)
  await openBackupPage()
  await app.window.getByRole('button', { name: 'Export settings…' }).click()
  await expect.poll(() => readFile(exportPath, 'utf8').catch(() => ''), { timeout: 15_000 }).toContain('o-bros-settings')

  const exported = JSON.parse(await readFile(exportPath, 'utf8'))
  expect(exported.formatVersion).toBe(1)
  expect(exported.settings.colorTheme).toBe('dracula')
  expect(exported.settings.terminalFontSize).toBe(15)
  expect(exported.settings.session).toBeUndefined()
  expect(exported.projectFolders).toEqual([app.projectFolder])

  const importPath = join(app.projectFolder, 'edited-settings.json')
  exported.settings.colorTheme = 'nord'
  exported.settings.terminalFontSize = 18
  await writeFile(importPath, JSON.stringify(exported), 'utf8')
  await answerOpenDialogWith(importPath)
  await app.window.getByRole('button', { name: 'Import settings…' }).click()
  await expect(app.window.getByText('Import these settings?')).toBeVisible()
  await app.window.getByRole('button', { name: 'Import', exact: true }).click()

  await app.window.waitForSelector('.rail')
  await expect
    .poll(() => app.window.evaluate(() => [localStorage.getItem('o-bros.colorTheme'), localStorage.getItem('o-bros.terminalFontSize')]), {
      timeout: 15_000
    })
    .toEqual(['nord', '18'])
})

test('refuses a file that is not an O-BROS export', async () => {
  const badPath = join(app.projectFolder, 'not-settings.json')
  await writeFile(badPath, JSON.stringify({ hello: 'world' }), 'utf8')
  await answerOpenDialogWith(badPath)
  await openBackupPage()
  await app.window.getByRole('button', { name: 'Import settings…' }).click()
  await expect(app.window.getByText('This file is not an O-BROS settings export.')).toBeVisible()
})
