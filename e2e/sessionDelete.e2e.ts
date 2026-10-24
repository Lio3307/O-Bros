import { expect, test } from '@playwright/test'
import { mkdir, readdir, utimes, writeFile } from 'node:fs/promises'
import { spawn } from 'node:child_process'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp
let sessionsFolder: string

const SESSION_DAYS = ['2026/02/10', '2026/09/01', '2026/10/14']

async function writeFakeSessions(): Promise<void> {
  if (app.homeFolder === null) {
    throw new Error('This test must run with a separate home folder so it never touches real sessions.')
  }
  const home = app.homeFolder
  sessionsFolder = join(home, '.codex', 'sessions')
  for (const [index, day] of SESSION_DAYS.entries()) {
    const folder = join(sessionsFolder, ...day.split('/'))
    await mkdir(folder, { recursive: true })
    const filePath = join(folder, `rollout-${day.split('/').join('-')}T08-00-00-session-${index}.jsonl`)
    const meta = { type: 'session_meta', payload: { id: `session-${index}`, cwd: app.projectFolder } }
    const message = { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: `task ${index}` }] } }
    await writeFile(filePath, `${JSON.stringify(meta)}\n${JSON.stringify(message)}\n`, 'utf8')
    const modified = new Date(`${day.split('/').join('-')}T08:00:00Z`)
    await utimes(filePath, modified, modified)
  }
}

async function countSessionFiles(): Promise<number> {
  const entries = await readdir(sessionsFolder, { recursive: true })
  return entries.filter((entry) => entry.endsWith('.jsonl')).length
}

test.beforeEach(async () => {
  app = await launchApp({ separateHome: true })
  await writeFakeSessions()
})

test.afterEach(async () => {
  await app.close()
})

test('deletes all Codex sessions from Storage and memory', async () => {
  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Storage and memory' }).click()
  await app.window.getByRole('switch', { name: 'Delete permanently' }).check()

  const codexRow = app.window.locator('.session-cleanup-row', { hasText: 'Codex' })
  await expect(codexRow).toContainText('3 conversations', { timeout: 20_000 })
  await codexRow.getByRole('button', { name: 'All', exact: true }).click()
  await codexRow.getByRole('button', { name: 'Delete' }).click()
  await app.window.getByRole('button', { name: 'Delete permanently', exact: true }).click()

  await expect.poll(countSessionFiles, { timeout: 20_000 }).toBe(0)
  await expect(app.window.getByText('Deleted 3 sessions', { exact: false })).toBeVisible()
})

test('keeps deleting when one session is in use, and says which could not be deleted', async () => {
  test.skip(process.platform !== 'win32', 'File locks that block deleting are a Windows behaviour')
  test.setTimeout(120_000)
  const lockedFile = join(sessionsFolder, '2026', '09', '01', 'rollout-2026-09-01T08-00-00-session-1.jsonl')
  const holder = spawn('powershell.exe', [
    '-NoProfile',
    '-Command',
    `$file = [System.IO.File]::Open('${lockedFile}', 'Open', 'Read', 'None'); Start-Sleep -Seconds 60; $file.Close()`
  ])
  try {
    await new Promise((resolve) => setTimeout(resolve, 2000))
    await app.window.getByTitle('Settings').click()
    await app.window.locator('.side-panel').getByRole('button', { name: 'Storage and memory' }).click()
    await app.window.getByRole('switch', { name: 'Delete permanently' }).check()
    const codexRow = app.window.locator('.session-cleanup-row', { hasText: 'Codex' })
    await expect(codexRow).toContainText('3 conversations', { timeout: 20_000 })
    await codexRow.getByRole('button', { name: 'All', exact: true }).click()
    await codexRow.getByRole('button', { name: 'Delete' }).click()
    await app.window.getByRole('button', { name: 'Delete permanently', exact: true }).click()

    await expect(app.window.getByText('1 session could not be deleted', { exact: false })).toBeVisible({ timeout: 20_000 })
    await expect.poll(countSessionFiles, { timeout: 10_000 }).toBe(1)
  } finally {
    holder.kill()
  }
})
