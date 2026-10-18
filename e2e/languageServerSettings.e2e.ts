import { expect, test } from '@playwright/test'
import { launchApp } from './launchApp'

test('sets an own language server command only when asked, without reloading the list', async () => {
  const app = await launchApp({ separateHome: true })
  try {
    await app.window.getByTitle('Settings').click()
    await app.window.locator('.side-panel').getByRole('button', { name: 'Language servers' }).click()
    const row = app.window.locator('.language-server-row', { hasText: 'Python (Pyright)' })
    await expect(row).toContainText('Not installed', { timeout: 20_000 })
    await expect(row.locator('input.field')).toHaveCount(0)

    await row.getByRole('button', { name: 'Use my own command…' }).click()
    const input = row.locator('input.field')
    await expect(input).toBeFocused()
    await app.window.getByRole('heading', { name: 'Not installed' }).click()
    await expect(row.getByRole('button', { name: 'Use my own command…' })).toBeVisible()
    await expect(app.window.getByText('Looking for language servers…')).toHaveCount(0)

    await row.getByRole('button', { name: 'Use my own command…' }).click()
    await input.fill('pyright-langserver --stdio')
    await input.press('Escape')
    await expect(row.getByRole('button', { name: 'Use my own command…' })).toBeVisible()

    await row.getByRole('button', { name: 'Use my own command…' }).click()
    await row.locator('input.field').fill('pyright-langserver --stdio')
    await row.locator('input.field').press('Enter')
    const customRow = app.window.locator('.language-server-row', { hasText: 'Python (Pyright)' })
    await expect(customRow).toContainText('Your own command', { timeout: 20_000 })
    await expect(customRow.locator('input.field')).toHaveValue('pyright-langserver --stdio')
  } finally {
    await app.close()
  }
})
