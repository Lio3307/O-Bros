import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const BUTTON_CLICK_COOLDOWN_MS = 500
const SHELL_AGENT_COMMAND = process.platform === 'win32' ? 'powershell -NoLogo' : 'bash'

async function answerFolderDialogWith(folderPath: string | null): Promise<void> {
  await app.application.evaluate(({ dialog }, chosen) => {
    dialog.showOpenDialog = async () => ({ canceled: chosen === null, filePaths: chosen === null ? [] : [chosen] })
  }, folderPath)
}

test.beforeEach(async () => {
  app = await launchApp({ separateHome: true, withoutProjectFolders: true })
  await app.window.evaluate((launchers) => {
    localStorage.setItem('o-bros.agentLaunchers', launchers)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['shell-agent']))
  }, JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: SHELL_AGENT_COMMAND }]))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
})

test.afterEach(async () => {
  await app.close()
})

test('asks for a project folder before starting an agent, but opens a plain terminal at home', async () => {
  await expect(app.window.getByText('Open a project folder to start')).toBeVisible()

  await app.window.getByRole('button', { name: 'Open a terminal in your home folder' }).click()
  await expect(app.window.locator('.tab-title').first()).toHaveText('Home')

  await answerFolderDialogWith(null)
  await app.window.getByRole('button', { name: 'ShellAgent' }).click()
  await expect(app.window.locator('.tab-title')).toHaveCount(1)
  await app.window.waitForTimeout(BUTTON_CLICK_COOLDOWN_MS)

  await answerFolderDialogWith(app.projectFolder)
  await app.window.getByRole('button', { name: 'ShellAgent' }).click()
  await expect(app.window.getByTitle(app.projectFolder, { exact: true })).toBeVisible()
  await expect(app.window.locator('.tab-title', { hasText: 'sample-project' })).toHaveCount(1)
})
