import { expect, test } from '@playwright/test'
import { mkdir, mkdtemp, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { launchApp } from './launchApp'

const WAITING_AGENT_SOURCE = 'setTimeout(() => undefined, 15000)\n'
const AGENT_THAT_STARTS_ANOTHER = `require('node:child_process').spawn(process.execPath, ['tools/codex/cli.js'], { stdio: 'ignore' })
setTimeout(() => undefined, 60000)
`

test('notices an agent typed into a plain terminal shortly after Enter', async () => {
  test.setTimeout(60_000)
  const app = await launchApp()
  try {
    const agentFolder = join(app.projectFolder, 'tools', 'claude-code')
    await mkdir(agentFolder, { recursive: true })
    await writeFile(join(agentFolder, 'cli.js'), WAITING_AGENT_SOURCE, 'utf8')

    await app.window.getByTitle(app.projectFolder, { exact: true }).click()
    await app.window.getByTitle('Plain terminal in the selected folder').click()
    const input = app.window.locator('.workspace .xterm-helper-textarea').first()
    await input.waitFor({ state: 'attached' })
    await app.window.waitForTimeout(2000)
    await input.focus()
    await app.window.keyboard.type('node tools/claude-code/cli.js')
    await app.window.keyboard.press('Enter')

    await app.window.getByTitle('Activity', { exact: true }).click()
    await expect(app.window.locator('.activity-row', { hasText: 'claude started' })).toHaveCount(1, { timeout: 10_000 })
    await expect(app.window.locator('.live-card').first()).toContainText('Claude')
  } finally {
    await app.close()
  }
})

test('groups agents by folder and names every agent inside one terminal', async () => {
  test.setTimeout(90_000)
  const parent = await mkdtemp(join(tmpdir(), 'o-bros-monitor-'))
  const [first, second] = [join(parent, 'first-project'), join(parent, 'second-project')]
  for (const folder of [first, second]) {
    await mkdir(join(folder, 'tools', 'codex'), { recursive: true })
    await writeFile(join(folder, 'tools', 'codex', 'cli.js'), 'setTimeout(() => undefined, 60000)\n', 'utf8')
    await mkdir(join(folder, 'tools', 'claude-code'), { recursive: true })
    await writeFile(join(folder, 'tools', 'claude-code', 'cli.js'), AGENT_THAT_STARTS_ANOTHER, 'utf8')
  }
  const app = await launchApp({ separateHome: true, settings: { projectRoots: [first, second] } })
  async function runInNewTerminal(folder: string, command: string): Promise<void> {
    await app.window.getByTitle(folder, { exact: true }).click()
    await app.window.getByTitle('Plain terminal in the selected folder').click()
    await app.window.waitForTimeout(2500)
    await app.window.locator('.workspace .xterm-helper-textarea:focus').waitFor({ state: 'attached' })
    await app.window.keyboard.type(command)
    await app.window.keyboard.press('Enter')
  }
  try {
    await runInNewTerminal(first, 'node tools/claude-code/cli.js')
    await runInNewTerminal(second, 'node tools/codex/cli.js')
    await app.window.getByTitle('Activity', { exact: true }).click()
    const folders = app.window.locator('.live-folder')
    await expect(folders).toHaveCount(2, { timeout: 30_000 })
    await expect(folders.nth(0).locator('.live-folder-title')).toContainText('first-project')
    await expect(folders.nth(1).locator('.live-folder-title')).toContainText('second-project')
    await expect(folders.nth(0).locator('.live-card')).toHaveCount(1)
    await expect(folders.nth(0).locator('.live-card')).toContainText('Also in this terminal: Codex', { timeout: 15_000 })
    await expect(folders.nth(1).locator('.live-card')).not.toContainText('Also in this terminal')
  } finally {
    await app.close()
    await rm(parent, { recursive: true, force: true, maxRetries: 10, retryDelay: 500 })
  }
})
