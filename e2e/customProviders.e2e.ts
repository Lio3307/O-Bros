import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { createServer, type Server } from 'node:http'
import type { AddressInfo } from 'node:net'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp
let providerServer: Server
let providerUrl = ''
const receivedKeys: string[] = []

const isWindows = process.platform === 'win32'
const SHELL_AGENT_COMMAND = isWindows ? 'powershell -NoLogo' : 'bash'
const SHELL_AGENT_START_MS = 5000
const SECRET_KEY = 'sk-test-secret-value-9876'
const PROOF_FILE = 'provider-proof.txt'

test.beforeEach(async () => {
  providerServer = createServer((request, response) => {
    receivedKeys.push(String(request.headers['x-api-key'] ?? ''))
    response.setHeader('Content-Type', 'application/json')
    response.end(request.url === '/v1/models' ? JSON.stringify({ data: [{ id: 'claude-test-model' }] }) : '{}')
  })
  await new Promise<void>((resolve) => providerServer.listen(0, '127.0.0.1', resolve))
  providerUrl = `http://127.0.0.1:${(providerServer.address() as AddressInfo).port}`
  app = await launchApp()
  await app.window.evaluate(
    ({ launchers, shown }) => {
      localStorage.setItem('o-bros.agentLaunchers', launchers)
      localStorage.setItem('o-bros.shownAgents', shown)
    },
    {
      launchers: JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: SHELL_AGENT_COMMAND }]),
      shown: JSON.stringify(['shell-agent'])
    }
  )
  await app.window.reload()
  await app.window.waitForSelector('.rail')
})

test.afterEach(async () => {
  await app.close()
  providerServer.close()
})

function printVariablesCommand(): string {
  const names = ['ANTHROPIC_BASE_URL', 'ANTHROPIC_MODEL', 'ANTHROPIC_AUTH_TOKEN', 'CLAUDE_CODE_MAX_OUTPUT_TOKENS']
  return isWindows
    ? `${names.map((name) => `"${name}=$env:${name}"`).join(',')} | Out-File -Encoding ascii ${PROOF_FILE}`
    : `printf '%s\\n' ${names.map((name) => `"${name}=$${name}"`).join(' ')} > ${PROOF_FILE}`
}

test('starts an agent with a custom provider whose key is stored encrypted and never exported', async () => {
  test.setTimeout(120_000)
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Provider accounts' }).click()
  await app.window.getByRole('button', { name: 'Add provider' }).click()
  await app.window.getByPlaceholder('My proxy').fill('Team proxy')
  await app.window.getByPlaceholder('https://api.example.com/anthropic').fill(providerUrl)
  await app.window.getByPlaceholder('claude-sonnet-4-5').fill('claude-test-model')
  await app.window.getByPlaceholder('200000').fill('200,000')
  await app.window.getByPlaceholder('32000').fill('16000')
  await app.window.getByPlaceholder('Paste the API key (optional)').fill(SECRET_KEY)
  await app.window.getByRole('button', { name: 'Add provider' }).last().click()

  const row = app.window.locator('.table-row', { hasText: 'Team proxy' })
  await expect(row).toContainText('Key saved, ends in 9876', { timeout: 15_000 })
  await expect(row).toContainText('Context 200,000 tokens')
  await expect(app.window.locator('body')).not.toContainText(SECRET_KEY)

  await row.getByRole('button', { name: 'Test connection' }).click()
  await expect(row).toContainText('The provider answered and offers claude-test-model.', { timeout: 15_000 })
  expect(receivedKeys).toContain(SECRET_KEY)

  const userData = await app.application.evaluate(({ app: electronApp }) => electronApp.getPath('userData'))
  const keyFile = await readFile(join(userData, 'provider-keys.json'), 'utf8')
  expect(keyFile).not.toContain(SECRET_KEY)
  const savedSettings = await app.window.evaluate(() => JSON.stringify(localStorage))
  expect(savedSettings).toContain('Team proxy')
  expect(savedSettings).not.toContain(SECRET_KEY)

  await app.window.locator('.side-panel').getByRole('button', { name: 'Agents' }).click()
  await app.window.locator('.launcher-provider').click()
  await app.window.locator('.popup-menu-item', { hasText: 'Team proxy' }).click()
  await expect(app.window.locator('.launcher-provider')).toHaveText('Team proxy')

  await app.window.getByTitle('Projects', { exact: true }).click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByRole('button', { name: 'ShellAgent' }).click()
  const input = app.window.locator('.workspace .xterm-helper-textarea').first()
  await input.waitFor({ state: 'attached' })
  await app.window.waitForTimeout(SHELL_AGENT_START_MS)
  await input.focus()
  await app.window.keyboard.type(printVariablesCommand())
  await app.window.keyboard.press('Enter')

  const readProof = () => readFile(join(app.projectFolder, PROOF_FILE), 'utf8').catch(() => '')
  await expect.poll(readProof, { timeout: 30_000 }).toContain('ANTHROPIC_AUTH_TOKEN=' + SECRET_KEY)
  const proof = await readProof()
  expect(proof).toContain('ANTHROPIC_BASE_URL=' + providerUrl)
  expect(proof).toContain('ANTHROPIC_MODEL=claude-test-model')
  expect(proof).toContain('CLAUDE_CODE_MAX_OUTPUT_TOKENS=16000')
})
