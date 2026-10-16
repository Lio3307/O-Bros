import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp } from './launchApp'

const WAITING_AGENT_SOURCE = 'setTimeout(() => undefined, 15000)\n'

test('notices an agent typed into a plain terminal shortly after Enter', async () => {
  test.setTimeout(60_000)
  const app = await launchApp()
  try {
    const agentFolder = join(app.projectFolder, 'tools', 'claude-code')
    await mkdir(agentFolder, { recursive: true })
    await writeFile(join(agentFolder, 'cli.js'), WAITING_AGENT_SOURCE, 'utf8')

    await app.window.getByTitle(app.projectFolder, { exact: true }).click()
    await app.window.getByTitle('Plain terminal in the selected folder').click()
    const input = app.window.locator('.workspace .xterm-helper-textarea').first()
    await input.waitFor({ state: 'attached' })
    await app.window.waitForTimeout(2000)
    await input.focus()
    await app.window.keyboard.type('node tools/claude-code/cli.js')
    await app.window.keyboard.press('Enter')

    await app.window.getByTitle('Activity', { exact: true }).click()
    await expect(app.window.locator('.activity-row', { hasText: 'claude started' })).toHaveCount(1, { timeout: 10_000 })
    await expect(app.window.locator('.live-card').first()).toContainText('claude')
  } finally {
    await app.close()
  }
})
