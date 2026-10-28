import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.APPEARANCE_SHOTS

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

async function openFile(name: string): Promise<void> {
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill(name)
  await app.window.locator('.quick-open-row', { hasText: name }).first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await expect(app.window.locator('.tab-active')).toContainText(name)
  await expect(app.window.getByText(`Opening ${name}…`)).toHaveCount(0)
  await expect(app.window.locator('.cm-editor')).toHaveCount(1)
}

async function acceptSuggestion(): Promise<void> {
  await app.window.waitForTimeout(250)
  await app.window.keyboard.press('Enter')
}

async function typeAtEnd(text: string): Promise<void> {
  await app.window.locator('.cm-content').click()
  await app.window.keyboard.press('ControlOrMeta+End')
  await app.window.keyboard.type(text, { delay: 40 })
  await expect(app.window.locator('.cm-content')).toContainText(text)
}

test('suggests names from other open files and real paths inside strings', async () => {
  app = await launchApp()
  await mkdir(join(app.projectFolder, 'components'))
  await writeFile(join(app.projectFolder, 'components', 'Button.ts'), 'export {}\n', 'utf8')
  await writeFile(join(app.projectFolder, 'billing.ts'), 'export const customerInvoiceTotal = 0\n', 'utf8')
  await writeFile(join(app.projectFolder, 'plan.md'), '# Plan\n\n', 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()

  await openFile('billing.ts')
  await openFile('plan.md')
  await typeAtEnd('Check custo')
  const list = app.window.locator('.cm-tooltip-autocomplete')
  await expect(list.locator('li', { hasText: 'customerInvoiceTotal' })).toBeVisible()
  await expect(list.locator('li', { hasText: 'customerInvoiceTotal' })).toContainText('billing.ts')
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/completion-words.png` })
  }
  await acceptSuggestion()
  await expect(app.window.locator('.cm-content')).toContainText('Check customerInvoiceTotal')

  await typeAtEnd(', see the [button](./')
  await expect(list.locator('li', { hasText: 'components/' })).toBeVisible()
  await expect(list.getByRole('option', { name: 'billing.ts', exact: true })).toBeVisible()
  await app.window.keyboard.type('comp', { delay: 40 })
  await acceptSuggestion()
  await app.window.keyboard.type('Bu', { delay: 40 })
  await expect(list.locator('li', { hasText: 'Button.ts' })).toBeVisible()
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/completion-paths.png` })
  }
  await acceptSuggestion()
  await expect(app.window.locator('.cm-content')).toContainText('[button](./components/Button.ts')
  await app.window.keyboard.press('Escape')
  await app.window.keyboard.press('ControlOrMeta+S')
  await expect(app.window.locator('.tab-modified-dot')).toHaveCount(0)
})

test('standard objects such as console and Math complete inside script blocks that no language server covers', async () => {
  app = await launchApp()
  await writeFile(join(app.projectFolder, 'App.svelte'), '<script>\n  let user = 1\n  \n</script>\n', 'utf8')
  await writeFile(join(app.projectFolder, 'page.html'), '<script>\n  let user = 1\n  \n</script>\n', 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  const list = app.window.locator('.cm-tooltip-autocomplete')

  for (const [name, typed, expected] of [
    ['App.svelte', 'console.', 'log'],
    ['page.html', 'Math.', 'floor']
  ]) {
    await openFile(name)
    await app.window.locator('.cm-line').nth(2).click()
    await app.window.keyboard.press('End')
    await app.window.keyboard.type(typed, { delay: 40 })
    await expect(list.getByRole('option', { name: expected, exact: true })).toBeVisible()
    await app.window.keyboard.press('Escape')
    await app.window.keyboard.press('Control+Space')
    await expect(list.getByRole('option', { name: expected, exact: true })).toBeVisible()
    await expect(list.locator('li', { hasText: 'let' })).toHaveCount(0)
    if (SHOTS !== undefined && name === 'App.svelte') {
      await app.window.screenshot({ path: `${SHOTS}/completion-console.png` })
    }
    await app.window.keyboard.type(expected.slice(0, 2), { delay: 40 })
    await acceptSuggestion()
    await expect(app.window.locator('.cm-content')).toContainText(typed + expected)
    await app.window.keyboard.press('ControlOrMeta+S')
    await expect(app.window.locator('.tab-modified-dot')).toHaveCount(0)
  }
})
