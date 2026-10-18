import { expect, test } from '@playwright/test'
import { launchApp } from './launchApp'

const isWindows = process.platform === 'win32'
const FAKE_KEY_VALUE = 'secret-value-that-must-not-show'

function fakeCommand(name: string): Record<string, string> {
  return isWindows ? { [`${name}.cmd`]: '@echo fake\r\n' } : { [name]: '#!/bin/sh\necho fake\n' }
}

test('lists agents that need a sign-in or an API key, and detects keys by name only', async () => {
  const app = await launchApp({
    separateHome: true,
    binFiles: { ...fakeCommand('amp'), ...fakeCommand('droid'), ...fakeCommand('vibe') },
    environment: { AMP_API_KEY: FAKE_KEY_VALUE }
  })
  try {
    await app.window.getByTitle('Settings').click()
    await app.window.locator('.side-panel').getByRole('button', { name: 'Provider accounts' }).click()
    const amp = app.window.locator('.agent-login-row', { hasText: 'Amp' })
    const droid = app.window.locator('.agent-login-row', { hasText: 'Factory Droid' })
    await expect(amp).toContainText('API key set in AMP_API_KEY', { timeout: 20_000 })
    await expect(amp).toContainText('Needs an account sign-in or an API key')
    await expect(droid).toContainText('Not checked')
    await expect(droid).toContainText('To sign in: Run droid and sign in when it asks.')
    const vibe = app.window.locator('.agent-login-row', { hasText: 'Run vibe' })
    await expect(vibe).toContainText('Not checked')
    await expect(vibe).toContainText('O-BROS has no sign-in details for this agent yet')
    await expect(app.window.locator('body')).not.toContainText(FAKE_KEY_VALUE)
  } finally {
    await app.close()
  }
})
