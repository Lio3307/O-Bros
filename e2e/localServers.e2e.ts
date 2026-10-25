import { expect, test } from '@playwright/test'
import { execFile } from 'node:child_process'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { launchApp, type RunningApp } from './launchApp'

const run = promisify(execFile)
const PORT = 47_321
const BUN_PORT = 47_322
const BUTTON_COOLDOWN_MS = 500

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

async function isAnswering(url: string): Promise<boolean> {
  try {
    const response = await fetch(url)
    return response.ok
  } catch {
    return false
  }
}

async function isBunInstalled(): Promise<boolean> {
  try {
    await run(process.platform === 'win32' ? 'bun.exe' : 'bun', ['--version'])
    return true
  } catch {
    return false
  }
}

async function typeInNewTerminal(command: string): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  const input = app.window.locator('.workspace .xterm-helper-textarea').first()
  await input.waitFor({ state: 'attached' })
  await app.window.waitForTimeout(2500)
  await input.focus()
  await app.window.keyboard.type(command)
  await app.window.keyboard.press('Enter')
}

test('lists a server that listens on IPv6 localhost and stops it after confirming', async () => {
  test.setTimeout(90_000)
  app = await launchApp({ separateHome: true })
  const url = `http://[::1]:${PORT}`
  await typeInNewTerminal(`node -e "require('http').createServer((q, s) => s.end('ok')).listen(${PORT}, '::1')"`)
  await expect.poll(() => isAnswering(url), { timeout: 15_000 }).toBe(true)

  await app.window.getByTitle('Activity', { exact: true }).click()
  const row = app.window.locator('.server-row', { hasText: `:${PORT}` })
  await expect(row).toBeVisible({ timeout: 15_000 })
  await expect(row).toContainText(`http://localhost:${PORT}`)

  await row.getByRole('button', { name: 'Stop' }).click()
  const dialog = app.window.locator('.modal')
  await expect(dialog).toContainText(`Stop the server on port ${PORT}?`)
  await dialog.getByRole('button', { name: 'Cancel' }).click()
  await app.window.waitForTimeout(BUTTON_COOLDOWN_MS)
  expect(await isAnswering(url)).toBe(true)

  await row.getByRole('button', { name: 'Stop' }).click()
  await app.window.locator('.modal').getByRole('button', { name: 'Stop server' }).click()
  await expect.poll(() => isAnswering(url), { timeout: 10_000 }).toBe(false)
  await expect(row).toHaveCount(0, { timeout: 15_000 })
})

test('lists a server started with "bun dev"', async () => {
  test.setTimeout(90_000)
  test.skip(!(await isBunInstalled()), 'bun is not installed on this computer')
  app = await launchApp({ separateHome: true })
  await writeFile(join(app.projectFolder, 'package.json'), JSON.stringify({ name: 'bun-dev-check', scripts: { dev: 'bun server.ts' } }), 'utf8')
  await writeFile(
    join(app.projectFolder, 'server.ts'),
    `Bun.serve({ port: ${BUN_PORT}, hostname: 'localhost', fetch: () => new Response('ok') })\nconsole.log('ready on ${BUN_PORT}')\n`,
    'utf8'
  )
  await typeInNewTerminal('bun dev')
  await expect.poll(() => isAnswering(`http://localhost:${BUN_PORT}`), { timeout: 20_000 }).toBe(true)

  await app.window.getByTitle('Activity', { exact: true }).click()
  await expect(app.window.locator('.server-row', { hasText: `:${BUN_PORT}` })).toBeVisible({ timeout: 15_000 })
})
