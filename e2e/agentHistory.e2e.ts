import { expect, test } from '@playwright/test'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const isWindows = process.platform === 'win32'
const AGENT_CREDIT = 'Co-Authored-By: Claude <noreply@anthropic.com>'

const FAKE_CLAUDE_SOURCE = `
const { execSync } = require('child_process')
const message = process.argv[2]
execSync('git -c user.name=agent -c user.email=agent@example.com commit --allow-empty -m "' + message + '" -m "${AGENT_CREDIT}"', {
  stdio: 'inherit'
})
`

test.beforeEach(async () => {
  app = await launchApp()
  await app.window.evaluate((identity) => {
    localStorage.setItem('o-bros.agentCommitIdentity', identity)
    localStorage.setItem('o-bros.agentGitPolicy', 'ask')
  }, JSON.stringify({ name: 'Project Owner', email: 'owner@example.com' }))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  const agentFolder = join(app.projectFolder, 'tools', 'claude-code')
  await mkdir(agentFolder, { recursive: true })
  await writeFile(join(agentFolder, 'cli.js'), FAKE_CLAUDE_SOURCE, 'utf8')
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

async function expectPromptOrExplain(text: string, proofFile: string): Promise<void> {
  try {
    await expect(app.window.getByText(text)).toBeVisible({ timeout: 60_000 })
  } catch (error) {
    const screen = await app.window.locator('.workspace .xterm-rows').first().innerText().catch(() => '')
    console.log(`--- ${proofFile} ---
${await readProof(proofFile)}
--- terminal ---
${screen}`)
    throw error
  }
}

async function typeInTerminal(command: string): Promise<void> {
  const terminalInput = app.window.locator('.workspace .xterm-helper-textarea').first()
  await terminalInput.focus()
  await app.window.keyboard.type(command)
  await app.window.keyboard.press('Enter')
}

test('keeps agents out of the history, even when started by hand in a plain terminal', async () => {
  test.setTimeout(180_000)
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })

  await typeInTerminal(savedOutput('git init -q; git init -q --bare ../remote.git; git remote add origin ../remote.git', 'init-proof.txt'))
  await expect.poll(() => readProof('init-proof.txt').then(() => true), { timeout: 30_000 }).toBe(true)

  await typeInTerminal(savedOutput('node tools/claude-code/cli.js by-agent', 'agent-proof.txt'))
  await expectPromptOrExplain('Allow it to commit?', 'agent-proof.txt')
  await app.window.getByRole('button', { name: 'Allow' }).click()
  await expect.poll(() => readProof('agent-proof.txt'), { timeout: 30_000 }).toContain('by-agent')

  await typeInTerminal(savedOutput(`git -c user.name=Me -c user.email=me@example.com commit --allow-empty -m mine -m "${AGENT_CREDIT}"`, 'mine-proof.txt'))
  await expect.poll(() => readProof('mine-proof.txt'), { timeout: 30_000 }).toContain('mine')
  await expect(app.window.getByText('Allow it to commit?')).toHaveCount(0)

  await typeInTerminal(savedOutput('git log --format=fuller', 'log-proof.txt'))
  await expect.poll(() => readProof('log-proof.txt'), { timeout: 30_000 }).toContain('by-agent')
  const log = await readProof('log-proof.txt')
  const agentCommit = log.slice(log.indexOf('by-agent') - 400, log.indexOf('by-agent') + 200)
  expect(agentCommit).toContain('Author:     Project Owner <owner@example.com>')
  expect(log).toContain('Author:     Me <me@example.com>')
  expect(log.split('Co-Authored-By').length - 1).toBe(1)

  await typeInTerminal(savedOutput('git push -u origin HEAD', 'push-proof.txt'))
  await expectPromptOrExplain('These commits would show an agent on GitHub:', 'push-proof.txt')
  await app.window.getByRole('button', { name: 'Cancel' }).click()
  await expect.poll(() => readProof('push-proof.txt'), { timeout: 30_000 }).toContain('GIT_BLOCKED')

  await app.window.getByTitle('Activity', { exact: true }).click()
  const rows = app.window.locator('.activity-row')
  await expect(rows.filter({ hasText: 'claude tried to commit' }).filter({ hasText: 'Allowed' })).toHaveCount(1)
  await expect(rows.filter({ hasText: 'claude started' })).toHaveCount(1)
})
