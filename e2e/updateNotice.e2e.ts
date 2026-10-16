import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const STATUS_CHANNEL = 'updater:statusChanged'

async function sendStatus(app: RunningApp, state: string): Promise<void> {
  await app.application.evaluate(
    ({ BrowserWindow }, { channel, status }) => {
      BrowserWindow.getAllWindows().forEach((window) => window.webContents.send(channel, status))
    },
    { channel: STATUS_CHANNEL, status: { state, currentVersion: '0.1.4', latestVersion: '9.9.9', percent: 0, message: null } }
  )
}

test('announces a new version once, then offers the restart when it is downloaded', async () => {
  const app = await launchApp()
  try {
    await sendStatus(app, 'available')
    const available = app.window.locator('.toast', { hasText: 'O-BROS 9.9.9 is available. You have 0.1.4.' })
    await expect(available).toBeVisible()
    await expect(available.getByRole('button', { name: 'Download' })).toBeVisible()

    await available.getByTitle('Dismiss').click()
    await sendStatus(app, 'available')
    await app.window.waitForTimeout(500)
    await expect(available).toHaveCount(0)

    await sendStatus(app, 'ready')
    const ready = app.window.locator('.toast', { hasText: 'O-BROS 9.9.9 is downloaded' })
    await expect(ready.getByRole('button', { name: 'Restart to update' })).toBeVisible()
  } finally {
    await app.close()
  }
})
