import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('a terminal stays inside its area so the status bar can still be clicked', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.waitForTimeout(3000)

  const layout = await app.window.evaluate(() => {
    const host = document.querySelector('.terminal-host') as HTMLElement
    const screen = document.querySelector('.xterm-screen') as HTMLElement
    const status = document.querySelector('.status-resources') as HTMLElement
    const statusBox = status.getBoundingClientRect()
    const atStatus = document.elementFromPoint(statusBox.left + statusBox.width / 2, statusBox.top + statusBox.height / 2)
    return {
      overflowBottom: screen.getBoundingClientRect().bottom - host.getBoundingClientRect().bottom,
      overflowRight: screen.getBoundingClientRect().right - host.getBoundingClientRect().right,
      isStatusOnTop: atStatus !== null && status.contains(atStatus)
    }
  })
  expect(layout.overflowBottom).toBeLessThanOrEqual(0)
  expect(layout.overflowRight).toBeLessThanOrEqual(0)
  expect(layout.isStatusOnTop).toBe(true)

  await app.window.locator('.status-resources').click()
  await expect(app.window.locator('.resource-popover')).toContainText('O-BROS')
  await expect(app.window.locator('.resource-popover')).toContainText('In your terminals')
})
