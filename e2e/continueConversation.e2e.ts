import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const isWindows = process.platform === 'win32'

const FAKE_CODEX_SOURCE = `
const fs = require('fs')
const os = require('os')
const path = require('path')
const crypto = require('crypto')
process.stdout.write('Fake codex ready\\r\\n\\u001b[?2004h> ')
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
}
const id = crypto.randomUUID()
const now = new Date()
const parts = [now.getFullYear(), now.getMonth() + 1, now.getDate()].map((part) => String(part).padStart(2, '0'))
const folder = path.join(os.homedir(), '.codex', 'sessions', ...parts)
const file = path.join(folder, 'rollout-' + now.getTime() + '-' + id + '.jsonl')
const lines = [{ type: 'session_meta', payload: { id, cwd: process.cwd() } }]
let typed = ''
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
    const text = typed.split('\\u001b[200~').join('').split('\\u001b[201~').join('').trim()
    typed = ''
    if (text === '') {
      continue
    }
    lines.push({ type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text }] } })
    lines.push({ type: 'response_item', payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'Working on: ' + text }] } })
    fs.mkdirSync(folder, { recursive: true })
    fs.writeFileSync(file, lines.map((line) => JSON.stringify(line)).join('\\n') + '\\n')
    process.stdout.write('\\r\\nDONE\\r\\n> ')
  }
})
`

const FAKE_AGENT_SOURCE = `
const fs = require('fs')
process.stdout.write('Fake agent ready\\r\\n\\u001b[?2004h> ')
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
}
let typed = ''
process.stdin.setEncoding('utf8')
process.stdin.on('data', (chunk) => {
  for (const character of chunk) {
    if (character !== '\\r') {
      typed += character
      continue
    }
    const text = typed.split('\\u001b[200~').join('').split('\\u001b[201~').join('')
    typed = ''
    if (text.trim() === '') {
      continue
    }
    fs.writeFileSync('handoff-received.txt', text)
    process.stdout.write('\\r\\nGOT HANDOFF\\r\\n> ')
  }
})
`

function wrapper(name: string, script: string): Record<string, string> {
  return isWindows
    ? { [`${name}.cmd`]: `@node "%~dp0${script}" %*\r\n` }
    : { [name]: `#!/bin/sh\nexec node "$(dirname "$0")/${script}" "$@"\n` }
}

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp({
    separateHome: true,
    binFiles: {
      'fake-codex.cjs': FAKE_CODEX_SOURCE,
      'fake-agent.cjs': FAKE_AGENT_SOURCE,
      ...wrapper('codex', 'fake-codex.cjs'),
      ...wrapper('fakeagent', 'fake-agent.cjs')
    }
  })
  const launchers = [
    { id: 'codex', name: 'Codex', command: 'codex' },
    { id: 'fake', name: 'Fake agent', command: 'fakeagent' }
  ]
  await app.window.evaluate((saved) => {
    localStorage.setItem('o-bros.agentLaunchers', saved)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['codex']))
  }, JSON.stringify(launchers))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
})

test.afterEach(async () => {
  await app.close()
})

const FAKE_KEY = 'sk-' + 'proj-' + 'Ab1'.repeat(14)

async function readProof(): Promise<string> {
  return readFile(join(app.projectFolder, 'handoff-received.txt'), 'utf8').catch(() => '')
}

async function writeSavedCodexConversation(): Promise<void> {
  const home = app.homeFolder ?? ''
  const folder = join(home, '.codex', 'sessions', '2026', '10', '20')
  await mkdir(folder, { recursive: true })
  const lines = [
    { type: 'session_meta', payload: { id: 'saved-codex-1', cwd: app.projectFolder } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: 'Fix the login bug in auth.ts' }] } },
    { type: 'response_item', payload: { type: 'message', role: 'assistant', content: [{ type: 'output_text', text: 'The token check is inverted.' }] } },
    { type: 'response_item', payload: { type: 'message', role: 'user', content: [{ type: 'input_text', text: `Use the test key ${FAKE_KEY} for the API` }] } }
  ]
  await writeFile(join(folder, 'rollout-saved-codex-1.jsonl'), lines.map((line) => JSON.stringify(line)).join('\n') + '\n', 'utf8')
}

test('continues a saved conversation in another agent from History and shows the thread', async () => {
  test.setTimeout(180_000)
  await writeSavedCodexConversation()
  await app.window.getByTitle('History', { exact: true }).click()
  const row = app.window.locator('.session-item', { hasText: 'Fix the login bug' })
  await expect(row).toBeVisible({ timeout: 20_000 })
  await row.locator('.session-row').click()

  await app.window.locator('.replay-actions').getByRole('button', { name: 'Continue with…' }).click()
  await app.window.locator('.popup-menu-item', { hasText: 'Fake agent' }).click()

  await expect.poll(readProof, { timeout: 90_000 }).toContain('[O-BROS handoff')
  const handoff = await readProof()
  expect(handoff).toContain('Fix the login bug in auth.ts')
  expect(handoff).toContain('The token check is inverted.')
  expect(handoff).toContain(`Working folder: ${app.projectFolder}`)
  expect(handoff).toContain('codex-resume')
  expect(handoff).toContain('## What to do now')
  expect(handoff).toContain('Use the test key [hidden] for the API')
  expect(handoff).not.toContain(FAKE_KEY)

  await app.window.getByTitle('History', { exact: true }).click()
  await expect(row.locator('.chip', { hasText: 'Codex → fakeagent' })).toBeVisible({ timeout: 20_000 })
})

test('links the continued Codex conversation into the same thread by its handoff marker', async () => {
  test.setTimeout(180_000)
  await writeSavedCodexConversation()
  await app.window.getByTitle('History', { exact: true }).click()
  const original = app.window.locator('.session-item', { hasText: 'Fix the login bug', hasNotText: 'Continued:' })
  await original.locator('.session-row').click()
  await app.window.locator('.replay-actions').getByRole('button', { name: 'Continue with…' }).click()
  await app.window.locator('.popup-menu-item', { hasText: 'Codex' }).click()
  await app.window.locator('.tab', { hasText: 'Codex' }).first().waitFor({ timeout: 60_000 })

  await app.window.getByTitle('History', { exact: true }).click()
  const continued = app.window.locator('.session-item', { hasText: 'Continued: Fix the login bug' })
  await expect
    .poll(
      async () => {
        await app.window.getByTitle('History', { exact: true }).click()
        await app.window.getByTitle('History', { exact: true }).click()
        return continued.count()
      },
      { timeout: 90_000 }
    )
    .toBe(1)
  await expect(continued.locator('.chip', { hasText: 'Codex → Codex' })).toBeVisible({ timeout: 30_000 })
  await expect(original.locator('.chip', { hasText: 'Codex → Codex' })).toBeVisible()
})

test('continues the conversation of a running agent tab in another agent', async () => {
  test.setTimeout(180_000)
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByRole('button', { name: 'Codex' }).first().click()
  const terminalInput = app.window.locator('.workspace .xterm-helper-textarea').first()
  await terminalInput.waitFor({ state: 'attached' })
  await app.window.waitForTimeout(6000)
  await terminalInput.focus()
  await app.window.keyboard.type('Add a dark mode toggle')
  await app.window.keyboard.press('Enter')
  await app.window.waitForTimeout(2000)

  await app.window.locator('.tab-bar .tab').first().click({ button: 'right' })
  await app.window.locator('.popup-menu-item', { hasText: 'Continue in another agent…' }).click()
  await app.window.locator('.popup-menu-item', { hasText: 'Fake agent' }).click()

  await expect.poll(readProof, { timeout: 90_000 }).toContain('Add a dark mode toggle')
  expect(await readProof()).toContain('Codex: Working on: Add a dark mode toggle')
})
