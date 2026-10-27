import { expect, test } from '@playwright/test'
import { readFile, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

async function openFile(name: string): Promise<void> {
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill(name)
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
}

async function keys(sequence: string[]): Promise<void> {
  for (const key of sequence) {
    await app.window.keyboard.press(key)
  }
}

test('Vim mode edits with motions, registers, marks and macros, and :w, :q and :q! act on the tab', async () => {
  test.setTimeout(90_000)
  app = await launchApp()
  const filePath = join(app.projectFolder, 'list.txt')
  await writeFile(filePath, 'alpha\nbeta\ngamma', 'utf8')

  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Editor', exact: true }).click()
  await app.window.getByText('Use Vim keys in the editor').click()
  await app.window.getByTitle('Projects', { exact: true }).click()
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await openFile('list.txt')

  const editor = app.window.locator('.cm-content')
  await expect(editor).toContainText('alpha')
  await editor.click()
  await keys(['Escape', 'g', 'g'])

  await keys(['Shift+"', 'a', 'y', 'y', 'G', 'Shift+"', 'a', 'p'])
  await keys(['g', 'g', 'm', 'b', 'j', 'd', 'd', 'u', "'", 'b', 'Shift+A'])
  await expect(app.window.locator('.cm-vim-panel')).toContainText('INSERT')
  await app.window.keyboard.type(' one')
  await keys(['Escape', 'q', 'z', 'j', 'Shift+A'])
  await app.window.keyboard.type('!')
  await keys(['Escape', 'q', 'j', 'Shift+@', 'z'])

  await app.window.keyboard.type(':w')
  await keys(['Enter'])
  await expect.poll(() => readFile(filePath, 'utf8')).toBe('alpha one\nbeta!\ngamma\nalpha!')

  await keys(['x'])
  await app.window.keyboard.type(':q')
  await keys(['Enter'])
  await expect(app.window.getByText('This file has unsaved changes.', { exact: false })).toBeVisible()
  await expect(app.window.locator('.tab', { hasText: 'list.txt' })).toHaveCount(1)

  await app.window.keyboard.type(':q!')
  await keys(['Enter'])
  await expect(app.window.locator('.tab', { hasText: 'list.txt' })).toHaveCount(0)
  expect(await readFile(filePath, 'utf8')).toBe('alpha one\nbeta!\ngamma\nalpha!')
})
