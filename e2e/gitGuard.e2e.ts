import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const isWindows = process.platform === 'win32'
const SHELL_AGENT_COMMAND = isWindows ? 'powershell -NoLogo' : 'bash'
const SHELL_AGENT_START_MS = 5000
const IDENTITY = '-c user.email=e2e@example.com -c user.name=e2e'

test.beforeEach(async () => {
  app = await launchApp()
  await app.window.evaluate(
    ({ launchers, shown, identity }) => {
      localStorage.setItem('o-bros.agentLaunchers', launchers)
      localStorage.setItem('o-bros.shownAgents', shown)
      localStorage.setItem('o-bros.agentCommitIdentity', identity)
    },
    {
      launchers: JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: SHELL_AGENT_COMMAND }]),
      shown: JSON.stringify(['shell-agent']),
      identity: JSON.stringify({ name: 'Project Owner', email: 'owner@example.com' })
    }
  )
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

test('asks the user before an agent commits, and blocks it when refused', async () => {
  test.setTimeout(120_000)
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByRole('button', { name: 'ShellAgent' }).click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })
  await app.window.waitForTimeout(SHELL_AGENT_START_MS)

  await typeInTerminal(savedOutput('git init -q', 'init-proof.txt'))
  await expect.poll(() => readProof('init-proof.txt').then(() => true), { timeout: 30_000 }).toBe(true)

  await typeInTerminal(savedOutput(`git ${IDENTITY} commit --allow-empty -m first-commit -m "Co-Authored-By: Claude <noreply@anthropic.com>"`, 'first-proof.txt'))
  await expect(app.window.getByText('Allow it to commit?')).toBeVisible({ timeout: 30_000 })
  await app.window.getByRole('button', { name: 'Allow' }).click()
  await expect.poll(() => readProof('first-proof.txt'), { timeout: 30_000 }).toContain('first-commit')

  await typeInTerminal(savedOutput(`git ${IDENTITY} commit --allow-empty -m second-commit`, 'second-proof.txt'))
  await expect(app.window.getByText('Allow it to commit?')).toBeVisible({ timeout: 30_000 })
  await app.window.getByRole('button', { name: 'Cancel' }).click()
  await expect.poll(() => readProof('second-proof.txt'), { timeout: 30_000 }).toContain('GIT_BLOCKED')

  await typeInTerminal(savedOutput('git log --format=fuller', 'log-proof.txt'))
  await expect.poll(() => readProof('log-proof.txt'), { timeout: 30_000 }).toContain('first-commit')
  const log = await readProof('log-proof.txt')
  expect(log).not.toContain('second-commit')
  expect(log).toContain('Author:     Project Owner <owner@example.com>')
  expect(log).toContain('Commit:     Project Owner <owner@example.com>')
  expect(log).not.toContain('Co-Authored-By')

  await app.window.getByTitle('Activity', { exact: true }).click()
  const rows = app.window.locator('.activity-row')
  await expect(rows.filter({ hasText: 'ShellAgent started' })).toHaveCount(1)
  await expect(rows.filter({ hasText: 'asked to commit' }).filter({ hasText: 'Allowed' })).toHaveCount(1)
  await expect(rows.filter({ hasText: 'second-commit' }).filter({ hasText: 'Denied' })).toHaveCount(1)
})

test('asks for the commit name and email the first time an agent commits', async () => {
  test.setTimeout(120_000)
  await app.window.evaluate(() => localStorage.removeItem('o-bros.agentCommitIdentity'))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByRole('button', { name: 'ShellAgent' }).click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })
  await app.window.waitForTimeout(SHELL_AGENT_START_MS)

  await typeInTerminal(savedOutput('git init -q', 'init-proof.txt'))
  await expect.poll(() => readProof('init-proof.txt').then(() => true), { timeout: 30_000 }).toBe(true)
  await typeInTerminal(savedOutput('git commit --allow-empty -m asked-identity', 'commit-proof.txt'))

  await app.window.getByRole('button', { name: 'Allow' }).click()
  await app.window.getByPlaceholder('Your name').fill('First Time')
  await app.window.getByRole('button', { name: 'Next' }).click()
  await app.window.getByPlaceholder('you@example.com').fill('first@example.com')
  await app.window.getByRole('button', { name: 'Save' }).click()

  await expect.poll(() => readProof('commit-proof.txt'), { timeout: 30_000 }).toContain('asked-identity')
  await typeInTerminal(savedOutput('git log --format=fuller', 'log-proof.txt'))
  await expect.poll(() => readProof('log-proof.txt'), { timeout: 30_000 }).toContain('Author:     First Time <first@example.com>')
})
