import { expect, test } from '@playwright/test'
import { access, writeFile } from 'node:fs/promises'
import { delimiter, join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SERVER_COMMAND = 'typescript-language-server'
const SERVER_TIMEOUT_MS = 45_000

async function isServerInstalled(): Promise<boolean> {
  const names = process.platform === 'win32' ? [`${SERVER_COMMAND}.cmd`, `${SERVER_COMMAND}.exe`] : [SERVER_COMMAND]
  for (const folder of (process.env.PATH ?? '').split(delimiter)) {
    for (const name of names) {
      try {
        await access(join(folder, name))
        return true
      } catch {
        continue
      }
    }
  }
  return false
}

async function openFile(app: RunningApp, name: string): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill(name)
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await app.window.locator('.cm-content').waitFor({ state: 'visible' })
}

test('gives TypeScript code intelligence from the installed language server', async () => {
  test.skip(!(await isServerInstalled()), `${SERVER_COMMAND} is not installed on this computer`)
  test.setTimeout(120_000)
  const app = await launchApp()
  try {
    await writeFile(join(app.projectFolder, 'tsconfig.json'), JSON.stringify({ compilerOptions: { strict: true } }), 'utf8')
    await writeFile(join(app.projectFolder, 'greeting.ts'), 'export function greetUser(name: string): string {\n  return name\n}\n', 'utf8')
    await writeFile(
      join(app.projectFolder, 'main.ts'),
      "import { greetUser } from './greeting'\n\nconst count: number = 'not a number'\ngreetUser('Ada')\n",
      'utf8'
    )
    await openFile(app, 'main.ts')

    await expect(app.window.locator('.cm-lintRange-error').first()).toBeVisible({ timeout: SERVER_TIMEOUT_MS })

    await app.window.locator('.cm-line').filter({ hasText: "greetUser('Ada')" }).getByText('greetUser').hover()
    await expect(app.window.locator('.cm-tooltip', { hasText: 'greetUser(name: string): string' }).first()).toBeVisible({
      timeout: SERVER_TIMEOUT_MS
    })

    await app.window.locator('.cm-content').click()
    await app.window.keyboard.press('ControlOrMeta+End')
    await app.window.keyboard.type("const text = 'abc'\ntext.toUpp")
    await app.window.keyboard.press('Control+Space')
    await expect(app.window.locator('.cm-tooltip-autocomplete')).toContainText('toUpperCase', { timeout: SERVER_TIMEOUT_MS })

    await app.window.keyboard.press('Escape')
    await expect(app.window.locator('.cm-tooltip-autocomplete')).toHaveCount(0)
    await app.window.locator('.cm-content').click()
    await app.window.keyboard.press('ControlOrMeta+S')
    await expect(app.window.locator('.toast', { hasText: 'Saved main.ts.' })).toBeVisible({ timeout: 15_000 })
    await expect(app.window.locator('.tab-modified-dot')).toHaveCount(0)
    await app.window.locator('.status-resources').click()
    await expect(app.window.locator('.resource-row', { hasText: 'TypeScript and JavaScript' })).toContainText('MB', { timeout: 20_000 })
    await app.window.keyboard.press('Escape')

    await app.window.getByTitle('Settings').click()
    await app.window.locator('.side-panel').getByRole('button', { name: 'Language servers' }).click()
    await expect(app.window.locator('.language-server-row', { hasText: 'open file' })).toContainText('TypeScript and JavaScript')
  } finally {
    await app.close()
  }
})
