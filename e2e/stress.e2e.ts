import { expect, test } from '@playwright/test'
import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const TERMINAL_COUNT = 8
const BUSY_OUTPUT_LINES = 3000

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

async function openTerminalInProject(app: RunningApp): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  const input = app.window.locator('.xterm-helper-textarea').last()
  await input.waitFor({ state: 'attached' })
  await input.focus()
}

function printManyLinesCommand(): string {
  return process.platform === 'win32'
    ? `1..${BUSY_OUTPUT_LINES} | ForEach-Object { "line $_" }`
    : `seq 1 ${BUSY_OUTPUT_LINES}`
}

test('keeps several terminals working at the same time', async () => {
  const app = await launchApp()
  try {
    for (let index = 0; index < TERMINAL_COUNT; index += 1) {
      await openTerminalInProject(app)
      await app.window.keyboard.type(`echo ${index} > proof-${index}.txt`)
      await app.window.keyboard.press('Enter')
    }

    for (let index = 0; index < TERMINAL_COUNT; index += 1) {
      const proofPath = join(app.projectFolder, `proof-${index}.txt`)
      await expect.poll(() => fileExists(proofPath), { timeout: 30_000 }).toBe(true)
    }
  } finally {
    await app.close()
  }
})

test('closes without a main process error while terminals are printing', async () => {
  const app = await launchApp()
  const errorOutput: string[] = []
  app.application.process().stderr?.on('data', (chunk: Buffer) => errorOutput.push(chunk.toString()))

  for (let index = 0; index < 3; index += 1) {
    await openTerminalInProject(app)
    await app.window.keyboard.type(printManyLinesCommand())
    await app.window.keyboard.press('Enter')
  }

  await app.close()

  const combined = errorOutput.join('')
  expect(combined).not.toContain('Object has been destroyed')
  expect(combined).not.toContain('Uncaught Exception')
})

test('keeps the window responsive while a terminal prints a lot of output', async () => {
  const app = await launchApp()
  try {
    await openTerminalInProject(app)
    await app.window.keyboard.type(printManyLinesCommand())
    await app.window.keyboard.press('Enter')

    await app.window.getByTitle('Settings', { exact: true }).click()
    await app.window.getByText('Storage and memory', { exact: true }).first().click()
    await expect(app.window.getByText('App cache', { exact: true })).toBeVisible({ timeout: 10_000 })
  } finally {
    await app.close()
  }
})
