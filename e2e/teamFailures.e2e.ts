import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const isWindows = process.platform === 'win32'
const BUTTON_DOUBLE_CLICK_GUARD_MS = 400

const FAKE_AGENT_SOURCE = `
const fs = require('fs')
const args = process.argv.slice(2)
if (args.includes('--fail')) {
  process.stdout.write('Error: failed to start the daemon: Access is denied. (os error 5)\\r\\n')
  process.exit(1)
}
fs.writeFileSync('fake-agent-args.json', JSON.stringify(args))
process.stdout.write('Fake agent ready\\r\\n\\u001b[?2004h> ')
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
}
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
    const text = typed.split('\\u001b[200~').join('').split('\\u001b[201~').join('')
    if (text.trim() === '') {
      typed = ''
      continue
    }
    fs.writeFileSync('fake-agent-received.txt', text)
    process.stdout.write('\\r\\nDONE: received ' + text.length + ' characters\\r\\n> ')
    typed = ''
  }
})
`

const AGENT_WRAPPERS: Record<string, string> = isWindows
  ? { 'codex.cmd': '@node "%~dp0fake-agent.cjs" %*\r\n' }
  : { codex: '#!/bin/sh\nexec node "$(dirname "$0")/fake-agent.cjs" "$@"\n' }

test.beforeEach(async () => {
  app = await launchApp({ separateHome: true, binFiles: { 'fake-agent.cjs': FAKE_AGENT_SOURCE, ...AGENT_WRAPPERS } })
  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Team (wot)' }).click()
  const sharedRow = app.window.locator('.table-row', { hasText: 'Shared skills folder' })
  await sharedRow.getByRole('button', { name: 'Install' }).click()
  await expect(sharedRow.getByRole('button', { name: 'Remove' })).toBeVisible({ timeout: 15_000 })
  await app.window.getByTitle('Projects').click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })
})

test.afterEach(async () => {
  await app.close()
})

async function readProof(fileName: string): Promise<string> {
  return readFile(join(app.projectFolder, fileName), 'utf8').catch(() => '')
}

function oneLine(text: string): string {
  return text.split(/\s+/).join(' ')
}

async function runInTerminal(command: string, proofFile: string): Promise<string> {
  const doneFile = `${proofFile}.done`
  const saved = isWindows
    ? `${command} 2>&1 | Out-File -Encoding ascii ${proofFile}; 'done' | Out-File -Encoding ascii ${doneFile}`
    : `${command} > ${proofFile} 2>&1; echo done > ${doneFile}`
  const terminalInput = app.window.locator('.workspace .xterm-helper-textarea').first()
  await terminalInput.focus()
  await app.window.keyboard.type(saved)
  await app.window.keyboard.press('Enter')
  await expect.poll(() => readProof(doneFile), { timeout: 120_000 }).not.toBe('')
  return oneLine(await readProof(proofFile))
}

test('reports an agent that exits at start instead of typing the task into a shell', async () => {
  test.setTimeout(180_000)
  const output = await runInTerminal('wot spawn codex --name broken --task "write the file" -- --fail', 'spawn-proof.txt')
  expect(output).toContain('exited right after it started, so no task was sent')
  expect(output).toContain('Access is denied')
  expect(output).not.toContain('OK: Summoned')

  const list = await runInTerminal('wot list', 'list-proof.txt')
  expect(list).toContain('broken (Codex): exited')
  const send = await runInTerminal('wot send broken "hello"', 'send-proof.txt')
  expect(send).toContain('is not running anymore')
})

test('a member the user interrupts with Ctrl+C becomes exited and refuses new messages', async () => {
  test.setTimeout(180_000)
  const spawned = await runInTerminal('wot spawn codex --name helper --task "first job"', 'spawn-proof.txt')
  expect(spawned).toContain('OK: Summoned team member "helper"')

  const memberRow = app.window.locator('.session-member-row', { hasText: 'helper' })
  await memberRow.click()
  const memberTerminal = app.window.locator('.team-frame:not(.tab-content-hidden) .xterm-helper-textarea')
  await memberTerminal.focus()
  await app.window.keyboard.press('Control+C')
  await expect(memberRow).toContainText('exited', { timeout: 15_000 })
  await expect(app.window.locator('.team-frame:not(.tab-content-hidden)')).toContainText('The agent program stopped')

  await app.window.getByRole('button', { name: 'Back' }).click()
  const send = await runInTerminal('wot send helper "second job"', 'send-proof.txt')
  expect(send).toContain('is not running anymore')
  expect(await readProof('fake-agent-received.txt')).toBe('first job')
})

test('asks before stopping a member from its row, and keeps it on cancel', async () => {
  test.setTimeout(180_000)
  await runInTerminal('wot spawn codex --name helper --task "first job"', 'spawn-proof.txt')
  const member = app.window.locator('.session-member', { hasText: 'helper' })
  await member.hover()
  await member.getByTitle('Stop "helper"').click()
  const dialog = app.window.locator('.modal')
  await expect(dialog).toContainText('Stop team member "helper"?')
  await expect(dialog).toContainText('conversation stays saved')
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await expect(member).toHaveCount(1)
  await app.window.waitForTimeout(BUTTON_DOUBLE_CLICK_GUARD_MS)

  await member.hover()
  await member.getByTitle('Stop "helper"').click()
  await app.window.locator('.modal-actions').getByRole('button', { name: 'Stop member' }).click()
  await expect(member).toHaveCount(0, { timeout: 15_000 })
  await expect(app.window.locator('.rail-badge')).toHaveCount(0)
})

test('refuses unknown options and passes options after -- to the agent', async () => {
  test.setTimeout(180_000)
  const refused = await runInTerminal('wot spawn codex --name docs --task "hi" --no-daemon', 'refused-proof.txt')
  expect(refused).toContain('does not know --no-daemon')
  expect(refused).toContain('put them after --')

  const spawned = await runInTerminal("wot spawn codex --name docs --task 'hi' -- --no-daemon 'two words'", 'spawn-proof.txt')
  expect(spawned).toContain('OK: Summoned team member "docs"')
  await expect.poll(() => readProof('fake-agent-args.json'), { timeout: 30_000 }).toBe(JSON.stringify(['--no-daemon', 'two words']))
  await expect.poll(() => readProof('fake-agent-received.txt'), { timeout: 30_000 }).toBe('hi')
})
