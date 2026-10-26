import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const isWindows = process.platform === 'win32'
const SHELL_AGENT_COMMAND = isWindows ? 'powershell -NoLogo' : 'bash'
const SHELL_START_MS = 5000
const SLOW_OUTPUT = isWindows ? '1..14 | % { $_; Start-Sleep -Milliseconds 400 }' : 'for i in $(seq 14); do echo $i; sleep 0.4; done'
const QUESTION = isWindows ? "Read-Host 'Do you want to proceed? (y/n)'" : "read -p 'Do you want to proceed? (y/n) ' answer"

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
  await app.window.evaluate((launchers) => {
    localStorage.setItem('o-bros.agentLaunchers', launchers)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['shell-agent']))
  }, JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: SHELL_AGENT_COMMAND }]))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
})

test.afterEach(async () => {
  await app.close()
})

async function typeLine(text: string): Promise<void> {
  await app.window.keyboard.type(text)
  await app.window.keyboard.press('Enter')
}

function focusedTerminalIsShown(): Promise<boolean> {
  return app.window.evaluate(() => {
    const focused = document.activeElement
    return focused !== null && focused.classList.contains('xterm-helper-textarea') && focused.closest('.tab-content-hidden') === null
  })
}

function focusIsInFocusedPane(): Promise<boolean> {
  return app.window.evaluate(() => document.activeElement?.closest('.pane-frame')?.classList.contains('pane-frame-focused') === true)
}

test('shows on the agent icon whether it is working, done or asking a question', async () => {
  test.setTimeout(120_000)
  await app.window.getByRole('button', { name: 'ShellAgent', exact: true }).click()
  const tabIcon = app.window.locator('.tab .agent-status-icon').first()
  const rowIcon = app.window.locator('.row-session .agent-status-icon').first()
  await expect(tabIcon).toHaveClass(/agent-status-ready/, { timeout: 20_000 })
  await app.window.waitForTimeout(SHELL_START_MS)

  await typeLine(SLOW_OUTPUT)
  await expect(tabIcon).toHaveClass(/agent-status-working/, { timeout: 5000 })
  await expect(rowIcon).toHaveClass(/agent-status-working/)
  await expect(tabIcon).toHaveAttribute('title', 'ShellAgent is working')

  await expect(tabIcon).toHaveClass(/agent-status-done/, { timeout: 20_000 })
  await expect(tabIcon.locator('.agent-status-badge svg')).toBeVisible()
  await expect(rowIcon).toHaveClass(/agent-status-done/)

  await typeLine(QUESTION)
  await expect(tabIcon).toHaveClass(/agent-status-asking/, { timeout: 10_000 })
  await expect(tabIcon.locator('.agent-status-badge')).toHaveText('?')
  await expect(tabIcon).toHaveAttribute('title', 'ShellAgent is asking you a question')

  await typeLine('y')
  await expect(tabIcon).toHaveClass(/agent-status-done/, { timeout: 15_000 })
})

test('puts the cursor in the terminal you switch to, and in the pane you used last in a split', async () => {
  test.setTimeout(90_000)
  await app.window.getByRole('button', { name: 'ShellAgent', exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await expect.poll(focusedTerminalIsShown).toBe(true)

  await app.window.locator('.tab', { hasText: 'ShellAgent' }).click()
  await expect.poll(focusedTerminalIsShown).toBe(true)
  await app.window.locator('.tab-bar-actions').getByTitle(/^Split right/).click()
  await expect(app.window.locator('.tab-content:not(.tab-content-hidden) .pane-frame')).toHaveCount(2)
  await expect.poll(focusIsInFocusedPane).toBe(true)

  const firstPane = app.window.locator('.tab-content:not(.tab-content-hidden) .pane-frame').first()
  await firstPane.locator('.pane-header').click({ position: { x: 4, y: 4 } })
  await expect(firstPane).toHaveClass(/pane-frame-focused/)

  await app.window.locator('.tab').filter({ hasNotText: 'ShellAgent' }).first().click()
  await expect.poll(focusedTerminalIsShown).toBe(true)
  await app.window.locator('.tab', { hasText: 'ShellAgent' }).click()
  await expect.poll(focusIsInFocusedPane).toBe(true)
  await expect(firstPane).toHaveClass(/pane-frame-focused/)

  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.getByTitle('Projects', { exact: true }).click()
  await expect.poll(focusIsInFocusedPane).toBe(true)
})
