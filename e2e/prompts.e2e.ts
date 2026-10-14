import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

const isWindows = process.platform === 'win32'

async function readTrimmed(fileName: string): Promise<string> {
  const content = await readFile(join(app.projectFolder, fileName), 'utf8').catch(() => '')
  return content.trim()
}

async function addPromptInSettings(title: string, text: string): Promise<void> {
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.getByText('Prompts', { exact: true }).first().click()
  await app.window.getByRole('button', { name: 'Add prompt' }).click()
  await app.window.getByPlaceholder('Title').last().fill(title)
  await app.window.getByPlaceholder('The text to send to the terminal').last().fill(text)
}

test('sends a saved prompt to the focused terminal and runs it', async () => {
  const command = isWindows ? "'from-prompt' | Out-File -Encoding ascii prompt-proof.txt" : 'echo from-prompt > prompt-proof.txt'
  await addPromptInSettings('Write a proof file', command)

  await app.window.getByTitle('Projects', { exact: true }).click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.xterm-helper-textarea').first().waitFor({ state: 'attached' })

  await app.window.keyboard.press('Control+Shift+L')
  await app.window.getByPlaceholder('Find a prompt to send to the terminal').fill('proof file')
  await app.window.keyboard.press('Control+Enter')

  await expect.poll(() => readTrimmed('prompt-proof.txt'), { timeout: 20_000 }).toBe('from-prompt')
})

test('lists the example prompts and filters them as you type', async () => {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.xterm-helper-textarea').first().waitFor({ state: 'attached' })

  await app.window.keyboard.press('Control+Shift+L')
  await expect(app.window.locator('.quick-open-row')).toHaveCount(4)

  await app.window.getByPlaceholder('Find a prompt to send to the terminal').fill('commit message')
  await expect(app.window.locator('.quick-open-row')).toHaveCount(1)
})
