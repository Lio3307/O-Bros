import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const FAKE_AGENT = "require('child_process').spawn(process.execPath, ['helper-server.cjs'], { stdio: 'ignore' })\nsetInterval(() => undefined, 1000)\n"
const HELPER = 'setInterval(() => undefined, 1000)\n'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('the close question names what is still running instead of raw command lines', async () => {
  test.setTimeout(90_000)
  app = await launchApp()
  await writeFile(join(app.projectFolder, 'fake-agent.cjs'), FAKE_AGENT, 'utf8')
  await writeFile(join(app.projectFolder, 'helper-server.cjs'), HELPER, 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.waitForTimeout(2500)
  await app.window.keyboard.type('node fake-agent.cjs')
  await app.window.keyboard.press('Enter')
  await app.window.waitForTimeout(3000)

  await app.application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].close())
  const dialog = app.window.getByRole('dialog')
  await expect(dialog).toContainText('Close O-BROS?', { timeout: 30_000 })
  const row = dialog.locator('.close-task')
  await expect(row.locator('.modal-item-title')).toHaveText('fake-agent')
  await expect(row.locator('.close-task-folder')).toHaveText('sample-project')
  await expect(row.locator('.close-task-detail')).toHaveText('Also running helper-server.')
  await expect(dialog).not.toContainText(' / ')
  if (process.env.APPEARANCE_SHOTS !== undefined) {
    await app.window.screenshot({ path: `${process.env.APPEARANCE_SHOTS}/close-dialog.png` })
  }
  const text = (await dialog.textContent()) ?? ''
  expect(text).not.toContain('node.exe')
  expect(text).not.toContain(':\\')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(dialog).toHaveCount(0)
})

test('the window still closes when the app inside does not answer', async () => {
  app = await launchApp()
  await app.application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].webContents.loadURL('about:blank'))
  const closed = app.application.evaluate(
    ({ BrowserWindow }) =>
      new Promise<boolean>((resolve) => {
        const window = BrowserWindow.getAllWindows()[0]
        window.once('closed', () => resolve(true))
        window.close()
      })
  )
  expect(await closed).toBe(true)
})
