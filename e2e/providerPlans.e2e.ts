import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.APPEARANCE_SHOTS

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('Provider accounts shows plan limits of Grok and ClinePass next to Claude and Codex, and says what to do when one is not readable', async () => {
  app = await launchApp({ separateHome: true })
  await app.application.evaluate(({ ipcMain }) => {
    const threeDays = Date.now() + 3 * 24 * 60 * 60 * 1000
    ipcMain.removeHandler('usage:plans')
    ipcMain.handle('usage:plans', () => [
      {
        id: 'grok',
        name: 'Grok',
        logoCommand: 'grok',
        plan: 'SuperGrok',
        windows: [{ label: 'mo', window: { percentUsed: 42, resetsAt: threeDays } }],
        errorMessage: null
      }
    ])
    ipcMain.removeHandler('usage:facts')
    ipcMain.handle('usage:facts', () => ({
      claudeHasLoginFile: false,
      claudePlan: null,
      codexLoginMode: null,
      codexPlan: null,
      geminiAuthType: null,
      grokHasLogin: true,
      clineHasLogin: false
    }))
  })
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Provider accounts' }).click()
  await app.window.getByRole('button', { name: 'Rescan' }).click()

  const grok = app.window.locator('.provider-block', { hasText: 'How much of your Grok plan' })
  await expect(grok).toContainText('SuperGrok')
  await expect(grok).toContainText('Monthly')
  await expect(grok).toContainText('42%')
  const clinePass = app.window.locator('.provider-block', { hasText: 'How much of your ClinePass plan' })
  if ((await clinePass.count()) > 0) {
    await expect(clinePass).toContainText('Not signed in · run cline auth')
  }
  if (SHOTS !== undefined) {
    await grok.scrollIntoViewIfNeeded()
    await app.window.screenshot({ path: `${SHOTS}/provider-plans.png` })
  }
})
