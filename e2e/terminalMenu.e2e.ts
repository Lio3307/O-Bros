import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.terminal-host').last().waitFor()
  await app.window.waitForTimeout(2500)
  await app.application.evaluate(({ clipboard }) => clipboard.writeText('echo from-the-clipboard'))
})

test.afterEach(async () => {
  await app.close()
})

async function rightClickTerminal(): Promise<void> {
  const box = await app.window.locator('.terminal-host').last().boundingBox()
  if (box === null) {
    throw new Error('The terminal is not visible.')
  }
  await app.window.mouse.click(box.x + 200, box.y + 100, { button: 'right' })
}

function terminalText(): Promise<string> {
  return app.window.locator('.xterm-rows').last().innerText()
}

test('right-click opens a menu instead of pasting', async () => {
  await rightClickTerminal()

  const menu = app.window.locator('.popup-menu')
  await expect(menu).toBeVisible()
  await expect(menu.getByRole('button', { name: 'Copy' })).toBeDisabled()
  await expect(menu.getByRole('button', { name: 'Split right' })).toBeVisible()
  await app.window.waitForTimeout(500)
  expect(await terminalText()).not.toContain('from-the-clipboard')

  await menu.getByRole('button', { name: 'Paste' }).click()
  await expect.poll(terminalText, { timeout: 5000 }).toContain('echo from-the-clipboard')
  await expect(menu).toHaveCount(0)
})

test('splits the terminal from its menu', async () => {
  await rightClickTerminal()
  await app.window.locator('.popup-menu').getByRole('button', { name: 'Split right' }).click()

  await expect(app.window.locator('.pane-frame')).toHaveCount(2)
})
