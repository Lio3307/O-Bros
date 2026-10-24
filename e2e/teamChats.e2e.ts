import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const isWindows = process.platform === 'win32'

const FAKE_CODEX_SOURCE = `
const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
process.stdout.write('Fake codex ready\\r\\n\\u001b[?2004h> ')
let typed = ''
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
}
function saveSession(text) {
  const now = new Date()
  const parts = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0'))
  const folder = path.join(os.homedir(), '.codex', 'sessions', ...parts)
  fs.mkdirSync(folder, { recursive: true })
  const id = crypto.randomUUID()
  const lines = [
    { type: 'session_meta', payload: { id, cwd: process.cwd() } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } }
  ]
  fs.writeFileSync(path.join(folder, 'rollout-' + now.getTime() + '-' + id + '.jsonl'), lines.map((line) => JSON.stringify(line)).join('\\n') + '\\n')
}
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  for (const character of chunk) {
    if (character === '\\u0003') {
      process.exit(0)
    }
    if (character !== '\\r') {
      typed += character
      continue
    }
    const text = typed.split('\\u001b[200~').join('').split('\\u001b[201~').join('')
    if (text.trim() === '') {
      typed = ''
      continue
    }
    saveSession(text)
    fs.writeFileSync('fake-codex-received.txt', text)
    process.stdout.write('\\r\\nDONE: received ' + text + '\\r\\n> ')
    typed = ''
  }
})
`

const CODEX_WRAPPERS: Record<string, string> = isWindows
  ? { 'codex.cmd': '@node "%~dp0fake-codex.cjs" %*\r\n' }
  : { codex: '#!/bin/sh\nexec node "$(dirname "$0")/fake-codex.cjs" "$@"\n' }

test.beforeEach(async () => {
  app = await launchApp({ separateHome: true, binFiles: { 'fake-codex.cjs': FAKE_CODEX_SOURCE, ...CODEX_WRAPPERS } })
  const launchers = [{ id: 'codex', name: 'Codex', command: 'codex' }]
  await app.window.evaluate((saved) => localStorage.setItem('o-bros.agentLaunchers', saved), JSON.stringify(launchers))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
})

test.afterEach(async () => {
  await app.close()
})

async function readProof(fileName: string): Promise<string> {
  return readFile(join(app.projectFolder, fileName), 'utf8').catch(() => '')
}

function savedOutput(command: string, fileName: string): string {
  return isWindows ? `${command} 2>&1 | Out-File -Encoding ascii ${fileName}` : `${command} > ${fileName} 2>&1`
}

async function typeInTerminal(command: string): Promise<void> {
  const terminalInput = app.window.locator('.workspace .xterm-helper-textarea').first()
  await terminalInput.focus()
  await app.window.keyboard.type(command)
  await app.window.keyboard.press('Enter')
}

async function openStoragePage(): Promise<void> {
  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Storage and memory' }).click()
}

test('marks a team member conversation in History and deletes it from Storage', async () => {
  test.setTimeout(120_000)
  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Team (wot)' }).click()
  const sharedRow = app.window.locator('.table-row', { hasText: 'Shared skills folder' })
  await sharedRow.getByRole('button', { name: 'Install' }).click()
  await expect(sharedRow.getByRole('button', { name: 'Remove' })).toBeVisible({ timeout: 15_000 })
  await app.window.getByTitle('Projects').click()

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })
  await typeInTerminal(savedOutput('wot spawn codex --name reviewer --task "Review the notes file please"', 'spawn-proof.txt'))
  await expect.poll(() => readProof('fake-codex-received.txt'), { timeout: 60_000 }).toBe('Review the notes file please')
  await typeInTerminal(savedOutput('wot stop reviewer', 'stop-proof.txt'))
  await expect.poll(() => readProof('stop-proof.txt'), { timeout: 30_000 }).toContain('Stopped "reviewer"')

  await app.window.getByTitle('History').click()
  await expect(app.window.locator('.session-item .chip')).toHaveText('Team member · reviewer', { timeout: 15_000 })
  await app.window.getByText('Team only').click()
  await expect(app.window.locator('.session-row')).toHaveCount(1)

  await openStoragePage()
  await app.window.getByRole('switch', { name: 'Delete permanently' }).check()
  const chatsRow = app.window.locator('.table-row', { hasText: 'Team member conversations' })
  await expect(chatsRow).toContainText('1 conversation')
  await chatsRow.getByRole('button', { name: 'Delete' }).click()
  await app.window.locator('.modal-actions').getByRole('button', { name: 'Delete permanently' }).click()
  await expect(chatsRow).toContainText('0 conversations', { timeout: 15_000 })
})
