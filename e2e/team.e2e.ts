import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const isWindows = process.platform === 'win32'
const BUTTON_DOUBLE_CLICK_GUARD_MS = 400

const FAKE_AGENT_SOURCE = `
const fs = require('fs')
process.stdout.write('Fake agent ready\\r\\n\\u001b[?2004h> ')
let typed = ''
if (process.stdin.isTTY) {
  process.stdin.setRawMode(true)
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
    fs.writeFileSync('fake-agent-received.txt', text)
    process.stdout.write('\\r\\nDONE: received ' + text + '\\r\\n> ')
    typed = ''
  }
})
`

test.beforeEach(async () => {
  app = await launchApp({ separateHome: true })
  const agentPath = join(app.projectFolder, 'fake-agent.cjs')
  await writeFile(agentPath, FAKE_AGENT_SOURCE, 'utf8')
  const launchers = [{ id: 'fake', name: 'Fake', command: `node "${agentPath}"` }]
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

async function installSharedSkill(): Promise<void> {
  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Team (wot)' }).click()
  const sharedRow = app.window.locator('.table-row', { hasText: 'Shared skills folder' })
  await sharedRow.getByRole('button', { name: 'Install' }).click()
  await expect(sharedRow.getByRole('button', { name: 'Remove' })).toBeVisible({ timeout: 15_000 })
  await app.window.getByTitle('Projects').click()
}

async function typeInTerminal(command: string): Promise<void> {
  const terminalInput = app.window.locator('.workspace .xterm-helper-textarea').first()
  await terminalInput.focus()
  await app.window.keyboard.type(command)
  await app.window.keyboard.press('Enter')
}

test('an agent summons a hidden team member, reads it and stops it', async () => {
  test.setTimeout(120_000)
  await installSharedSkill()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })

  await typeInTerminal(savedOutput('wot status', 'status-proof.txt'))
  await expect.poll(() => readProof('status-proof.txt'), { timeout: 30_000 }).toContain('O-BROS is running')

  await typeInTerminal(savedOutput('wot spawn fake --name helper --task "hello team"', 'spawn-proof.txt'))
  await expect.poll(() => readProof('fake-agent-received.txt'), { timeout: 60_000 }).toBe('hello team')
  await expect.poll(() => readProof('spawn-proof.txt'), { timeout: 10_000 }).toContain('Summoned team member "helper"')

  await expect(app.window.locator('.rail-badge')).toHaveText('1')
  const leadGroup = app.window.locator('.session-group', { has: app.window.locator('.row-session') })
  await expect(leadGroup.locator('.session-member-row')).toContainText('helper')
  await expect(leadGroup.locator('.session-member-row')).toContainText('hello team')
  await leadGroup.locator('.session-member-row').click()
  await expect(app.window.locator('.team-frame:not(.tab-content-hidden) .team-flow-member')).toContainText('helper')
  await expect(app.window.locator('.tab-bar')).toBeVisible()
  await app.window.getByRole('button', { name: 'Back' }).click()
  await expect(app.window.locator('.team-frame:not(.tab-content-hidden)')).toHaveCount(0)
  await app.window.locator('.rail').getByTitle('Team members: 1. Show the newest one.').click()
  await expect(app.window.locator('.team-frame:not(.tab-content-hidden) .team-flow-member')).toContainText('helper')
  await app.window.waitForTimeout(BUTTON_DOUBLE_CLICK_GUARD_MS)
  await app.window.getByRole('button', { name: 'Back' }).click()
  await expect(app.window.locator('.team-frame:not(.tab-content-hidden)')).toHaveCount(0)

  await app.window.getByTitle('Activity', { exact: true }).click()
  await expect(app.window.locator('.live-card', { hasText: 'Team member "helper"' })).toBeVisible({ timeout: 10_000 })

  await app.window.getByTitle('Projects').click()
  await typeInTerminal(savedOutput('wot read helper', 'read-proof.txt'))
  await expect.poll(() => readProof('read-proof.txt'), { timeout: 30_000 }).toContain('DONE: received hello team')

  await typeInTerminal(savedOutput('wot stop helper', 'stop-proof.txt'))
  await expect.poll(() => readProof('stop-proof.txt'), { timeout: 30_000 }).toContain('Stopped "helper"')
  await expect(app.window.locator('.rail-badge')).toHaveCount(0)

  await app.window.getByTitle('Activity', { exact: true }).click()
  const rows = app.window.locator('.activity-row')
  await expect(rows.filter({ hasText: 'joined the team as "helper"' })).toHaveCount(1)
  await expect(rows.filter({ hasText: 'left the team ("helper")' })).toHaveCount(1)
})

test('tells the agent when the requested agent is unknown', async () => {
  await installSharedSkill()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })

  await typeInTerminal(savedOutput('wot spawn superbot --name x --task hi', 'unknown-proof.txt'))
  await expect.poll(() => readProof('unknown-proof.txt'), { timeout: 30_000 }).toContain('is not an agent O-BROS knows')
})

test('keeps team features off until the skill is installed, and shows its version', async () => {
  await expect(app.window.getByTitle('Team (wot)')).toHaveCount(0)
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })
  await typeInTerminal(savedOutput('wot status', 'off-proof.txt'))
  await expect.poll(() => readProof('off-proof.txt'), { timeout: 30_000 }).toContain('WOT_NOT_INSTALLED')

  await app.window.getByTitle('Settings').click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Team (wot)' }).click()
  const sharedRow = app.window.locator('.table-row', { hasText: 'Shared skills folder' })
  await expect(sharedRow.getByText('Not installed', { exact: false })).toBeVisible({ timeout: 15_000 })
  await sharedRow.getByRole('button', { name: 'Install' }).click()
  await expect(sharedRow.getByText('installed', { exact: false })).toBeVisible({ timeout: 15_000 })
})

test('stops team members when the terminal that summoned them closes', async () => {
  test.setTimeout(120_000)
  await installSharedSkill()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })

  await typeInTerminal(savedOutput('wot spawn fake --name helper --task "hello team"', 'spawn-proof.txt'))
  await expect.poll(() => readProof('fake-agent-received.txt'), { timeout: 60_000 }).toBe('hello team')
  await expect(app.window.locator('.rail-badge')).toHaveText('1')

  await app.window.getByTitle('Close tab').first().click()
  const confirmClose = app.window.getByRole('button', { name: 'Close', exact: true })
  if (await confirmClose.isVisible().catch(() => false)) {
    await confirmClose.click()
  }

  await expect(app.window.getByText('Stopped team member "helper" to free memory', { exact: false })).toBeVisible({ timeout: 15_000 })
  await expect(app.window.locator('.rail-badge')).toHaveCount(0)
})
