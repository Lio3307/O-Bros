import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const STATUS_CHANNEL = 'updater:statusChanged'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

async function sendStatus(state: string, percent = 0): Promise<void> {
  await app.application.evaluate(
    ({ BrowserWindow }, { channel, status }) => {
      BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(channel, status))
    },
    { channel: STATUS_CHANNEL, status: { state, currentVersion: '0.1.4', latestVersion: '9.9.9', percent, message: null } }
  )
}

function card() {
  return app.window.locator('.update-notice')
}

test('shows an update card that downloads, then offers the restart when nothing is running', async () => {
  app = await launchApp({ separateHome: true })
  await sendStatus('available')
  await expect(card()).toContainText('O-BROS v9.9.9 is available.')
  await expect(card().getByRole('button', { name: 'Download update' })).toBeVisible()
  await expect(card().getByRole('button', { name: 'Release notes' })).toBeVisible()

  await sendStatus('downloading', 42)
  await expect(card()).toContainText('Downloading… 42%')

  await sendStatus('ready', 100)
  await expect(card()).toContainText('O-BROS v9.9.9 is ready.')
  await expect(card().getByRole('button', { name: 'Restart to update' })).toBeVisible()

  await card().getByTitle('Hide until the next version').click()
  await expect(card()).toHaveCount(0)
  await sendStatus('ready', 100)
  await app.window.waitForTimeout(500)
  await expect(card()).toHaveCount(0)
})

test('does not restart while a terminal is busy, and installs when O-BROS closes instead', async () => {
  test.setTimeout(60_000)
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  const input = app.window.locator('.workspace .xterm-helper-textarea').first()
  await input.waitFor({ state: 'attached' })
  await app.window.waitForTimeout(2500)
  await input.focus()
  await app.window.keyboard.type('node -e "setInterval(() => {}, 1000)"')
  await app.window.keyboard.press('Enter')
  await app.window.waitForTimeout(1500)

  await sendStatus('ready', 100)
  await expect(card()).toContainText('nothing restarts now', { timeout: 20_000 })
  await card().getByRole('button', { name: 'Update when I close O-BROS' }).click()
  await expect(card()).toHaveCount(0)
  await expect(app.window.locator('.toast', { hasText: 'installs the next time you close O-BROS' })).toBeVisible()
})
