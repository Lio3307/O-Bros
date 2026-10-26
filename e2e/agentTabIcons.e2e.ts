import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SHELL_AGENT_COMMAND = process.platform === 'win32' ? 'powershell -NoLogo' : 'bash'
const SHORT_AGENT_SOURCE = 'setTimeout(() => undefined, 6000)\n'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

function tabIcon() {
  return app.window.locator('.tab .agent-status-icon').first()
}

function runningTitle(label: string): RegExp {
  return new RegExp(`^${label} is (starting|working|ready for a task|done, your turn|asking you a question)$`)
}

test('a launched agent shows its own icon and name, and dims after a restart', async () => {
  app = await launchApp()
  await app.window.evaluate((launchers) => {
    localStorage.setItem('o-bros.agentLaunchers', launchers)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['shell-agent']))
  }, JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: SHELL_AGENT_COMMAND }]))
  await app.window.reload()
  await app.window.waitForSelector('.rail')

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByRole('button', { name: 'ShellAgent', exact: true }).click()

  await expect(app.window.locator('.tab', { hasText: 'ShellAgent' })).toBeVisible()
  await expect(tabIcon()).toHaveAttribute('title', runningTitle('ShellAgent'))
  await expect(app.window.locator('.row-session .agent-status-icon')).toHaveCount(1)

  await app.window.waitForTimeout(800)
  await app.window.reload()
  await app.window.waitForSelector('.rail')

  await expect(app.window.locator('.tab', { hasText: 'ShellAgent' })).toBeVisible()
  await expect(tabIcon()).toHaveClass(/agent-status-stopped/)
  await expect(tabIcon()).toHaveAttribute('title', 'ShellAgent is not running here any more')
})

test('a launched agent turns grey after you quit it and the terminal stays open', async () => {
  test.setTimeout(90_000)
  app = await launchApp()
  await app.window.evaluate((launchers) => {
    localStorage.setItem('o-bros.agentLaunchers', launchers)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['shell-agent']))
  }, JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: SHELL_AGENT_COMMAND }]))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByRole('button', { name: 'ShellAgent', exact: true }).click()
  await expect(tabIcon()).toHaveAttribute('title', runningTitle('ShellAgent'))

  await app.window.waitForTimeout(11_000)
  const input = app.window.locator('.workspace .xterm-helper-textarea').first()
  await input.focus()
  await app.window.keyboard.type('exit')
  await app.window.keyboard.press('Enter')

  await expect(tabIcon()).toHaveClass(/agent-status-stopped/, { timeout: 15_000 })
  await expect(app.window.locator('.tab', { hasText: 'ShellAgent' })).toBeVisible()
})

test('an agent typed into a plain terminal shows its icon while it runs', async () => {
  test.setTimeout(90_000)
  app = await launchApp()
  const agentFolder = join(app.projectFolder, 'tools', 'claude-code')
  await mkdir(agentFolder, { recursive: true })
  await writeFile(join(agentFolder, 'cli.js'), SHORT_AGENT_SOURCE, 'utf8')

  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  const input = app.window.locator('.workspace .xterm-helper-textarea').first()
  await input.waitFor({ state: 'attached' })
  await app.window.waitForTimeout(2000)
  await expect(tabIcon()).toHaveCount(0)
  await input.focus()
  await app.window.keyboard.type('node tools/claude-code/cli.js')
  await app.window.keyboard.press('Enter')

  await expect(tabIcon()).toHaveAttribute('title', runningTitle('claude'), { timeout: 10_000 })
  await expect(tabIcon()).toHaveClass(/agent-status-stopped/, { timeout: 40_000 })
})
