import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp } from './launchApp'

const isWindows = process.platform === 'win32'
const SKILL_PATH = join('.agents', 'skills', 'wot', 'SKILL.md')
const OLD_SKILL = '---\nname: wot\ndescription: old\nmetadata:\n  version: "1.0.0"\n---\n\nOld instructions.\n'

test('offers to update an outdated wot skill and tells the agent about it', async () => {
  test.setTimeout(90_000)
  const app = await launchApp({ separateHome: true, homeFiles: { [SKILL_PATH]: OLD_SKILL } })
  try {
    const notice = app.window.locator('.toast', { hasText: 'The wot skill has an update (1.0.0 →' })
    await expect(notice).toBeVisible({ timeout: 20_000 })

    await app.window.getByTitle(app.projectFolder, { exact: true }).click()
    await app.window.getByTitle('Plain terminal in the selected folder').click()
    const input = app.window.locator('.workspace .xterm-helper-textarea').first()
    await input.waitFor({ state: 'attached' })
    await input.focus()
    const proof = 'status-proof.txt'
    await app.window.keyboard.type(isWindows ? `wot status 2>&1 | Out-File -Encoding ascii ${proof}` : `wot status > ${proof} 2>&1`)
    await app.window.keyboard.press('Enter')
    await expect
      .poll(() => readFile(join(app.projectFolder, proof), 'utf8').catch(() => ''), { timeout: 30_000 })
      .toContain('NOTE: Your wot skill is outdated (1.0.0')

    await notice.getByRole('button', { name: 'Update all' }).click()
    await expect(app.window.locator('.toast', { hasText: 'The wot skill is now' })).toBeVisible({ timeout: 15_000 })
    const homeFolder = app.homeFolder ?? ''
    expect(await readFile(join(homeFolder, SKILL_PATH), 'utf8')).toContain('Use wot when the user asks')
  } finally {
    await app.close()
  }
})
