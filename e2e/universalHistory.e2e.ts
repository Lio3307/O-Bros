import { expect, test } from '@playwright/test'
import { mkdir, readdir, utimes, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp } from './launchApp'

const DAY_MS = 24 * 60 * 60 * 1000

async function writeCodexSession(home: string, id: string, text: string, ageDays: number): Promise<void> {
  const when = new Date(Date.now() - ageDays * DAY_MS)
  const folder = join(home, '.codex', 'sessions', String(when.getFullYear()), String(when.getMonth() + 1).padStart(2, '0'), String(when.getDate()).padStart(2, '0'))
  await mkdir(folder, { recursive: true })
  const filePath = join(folder, `rollout-${id}.jsonl`)
  const lines = [
    { type: 'session_meta', payload: { id, cwd: home } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } },
    { type: 'response_item', payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Done.' }] } }
  ]
  await writeFile(filePath, lines.map((line) => JSON.stringify(line)).join('\n') + '\n', 'utf8')
  await utimes(filePath, when, when)
}

test('saves conversations into <agent>-resume, moves the folder and keeps only recent copies', async () => {
  test.setTimeout(180_000)
  const app = await launchApp({ separateHome: true })
  try {
    const home = app.homeFolder ?? ''
    await writeCodexSession(home, 'recent-chat', 'Fix the login bug', 1)
    await writeCodexSession(home, 'old-chat', 'Old question', 120)
    const chosenParent = join(home, '..', 'big-drive')
    await mkdir(chosenParent)
    await app.application.evaluate(({ dialog }, folder) => {
      dialog.showOpenDialog = async () => ({ canceled: false, filePaths: [folder] })
    }, chosenParent)

    await app.window.getByTitle('Settings').click()
    await app.window.locator('.side-panel').getByRole('button', { name: 'Storage and memory' }).click()
    const section = app.window.locator('.settings-section').filter({ has: app.window.getByRole('heading', { name: 'Universal history', exact: true }) })
    await section.getByRole('button', { name: 'Save now' }).click()
    const codexRow = section.locator('.history-agent-row', { hasText: 'codex-resume' })
    await expect(codexRow).toContainText('2 conversations', { timeout: 30_000 })

    await section.getByRole('button', { name: 'Move…' }).click()
    const movedFolder = join(chosenParent, 'o-bros-history')
    await expect(section.getByText(movedFolder, { exact: true })).toBeVisible({ timeout: 30_000 })
    expect((await readdir(join(movedFolder, 'codex-resume'))).length).toBe(2)

    await section.getByRole('button', { name: '30 days' }).click()
    await app.window.locator('.modal-actions').getByRole('button', { name: 'Keep 30 days' }).click()
    await expect(codexRow).toContainText('1 conversation', { timeout: 30_000 })
    const kept = await readdir(join(movedFolder, 'codex-resume'))
    expect(kept.length).toBe(1)
    expect(kept[0]).toContain('recent-chat')

    const disks = app.window.locator('.settings-section').filter({ has: app.window.getByRole('heading', { name: 'Your disks', exact: true }) })
    await expect(disks).toContainText('Universal history (O-BROS copies)', { timeout: 30_000 })
  } finally {
    await app.close()
  }
})
