import { expect, test } from '@playwright/test'
import { lstat, readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp } from './launchApp'

const CLINE_TASK_FILE = '.cline/data/sessions/task-1/history.json'

async function isLink(path: string): Promise<boolean> {
  return (await lstat(path)).isSymbolicLink()
}

test('moves an agent conversation folder to a chosen folder and back', async () => {
  test.setTimeout(120_000)
  const app = await launchApp({
    separateHome: true,
    homeFiles: { [CLINE_TASK_FILE]: '["hello"]', '.local/share/opencode/auth.json': '{}' }
  })
  try {
    if (app.homeFolder === null) {
      throw new Error('This test must run with a separate home folder.')
    }
    const home = app.homeFolder
    const sessionsFolder = join(home, '.cline', 'data', 'sessions')
    const chosenFolder = join(home, '..', 'other-drive', 'chat-history')
    await app.application.evaluate(({ dialog }, folder) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] })
    }, chosenFolder)

    await app.window.getByTitle('Settings').click()
    await app.window.locator('.side-panel').getByRole('button', { name: 'Storage and memory' }).click()
    const clineRow = app.window.locator('.conversation-row', { hasText: 'Cline conversations' })
    const openCodeRow = app.window.locator('.conversation-row', { hasText: 'OpenCode conversations' })
    await expect(clineRow.getByRole('button', { name: 'Move' })).toBeDisabled({ timeout: 20_000 })
    await expect(openCodeRow.getByRole('button', { name: 'Move' })).toBeDisabled()

    await app.window.getByRole('button', { name: 'Choose folder…' }).click()
    await expect(app.window.getByText(chosenFolder, { exact: true })).toBeVisible({ timeout: 15_000 })
    await expect(openCodeRow.getByRole('button', { name: 'Move' })).toBeDisabled()

    await clineRow.getByRole('button', { name: 'Move' }).click()
    await app.window.locator('.modal-actions').getByRole('button', { name: 'Move' }).click()
    await expect(clineRow).toContainText('Saved in', { timeout: 30_000 })
    expect(await isLink(sessionsFolder)).toBe(true)
    expect(await readFile(join(chosenFolder, 'cline', 'task-1', 'history.json'), 'utf8')).toBe('["hello"]')
    expect(await readFile(join(home, CLINE_TASK_FILE), 'utf8')).toBe('["hello"]')

    await clineRow.getByRole('button', { name: 'Move back' }).click()
    await app.window.locator('.modal-actions').getByRole('button', { name: 'Move back' }).click()
    await expect(clineRow.getByRole('button', { name: 'Move', exact: true })).toBeVisible({ timeout: 30_000 })
    expect(await isLink(sessionsFolder)).toBe(false)
    expect(await readFile(join(home, CLINE_TASK_FILE), 'utf8')).toBe('["hello"]')
  } finally {
    await app.close()
  }
})
