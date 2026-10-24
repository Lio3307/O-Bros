import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const SHELL_AGENT_COMMAND = process.platform === 'win32' ? 'powershell -NoLogo' : 'bash'
const BUTTON_COOLDOWN_MS = 500

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
  await app.window.evaluate((launchers) => {
    localStorage.setItem('o-bros.agentLaunchers', launchers)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['shell-agent']))
  }, JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: SHELL_AGENT_COMMAND }]))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
})

test.afterEach(async () => {
  await app.close()
})

function tab(name: string) {
  return app.window.locator('.tab', { hasText: name })
}

test('asks before closing a terminal whose agent is running, and keeps it on cancel', async () => {
  await app.window.getByRole('button', { name: 'ShellAgent', exact: true }).click()
  await expect(tab('ShellAgent')).toBeVisible()

  await tab('ShellAgent').getByTitle('Close', { exact: false }).click()
  const dialog = app.window.locator('.modal')
  await expect(dialog).toContainText('Close "ShellAgent" while its agent runs?')
  await expect(dialog).toContainText('ShellAgent is still running')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(tab('ShellAgent')).toBeVisible()
  await app.window.waitForTimeout(BUTTON_COOLDOWN_MS)

  await tab('ShellAgent').getByTitle('Close', { exact: false }).click()
  await app.window.locator('.modal').getByRole('button', { name: 'Close terminal' }).click()
  await expect(tab('ShellAgent')).toHaveCount(0)
})

test('closes a plain terminal at once', async () => {
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await expect(tab('sample-project')).toBeVisible()

  await tab('sample-project').getByTitle('Close', { exact: false }).click()
  await expect(tab('sample-project')).toHaveCount(0)
  await expect(app.window.locator('.modal')).toHaveCount(0)
})
