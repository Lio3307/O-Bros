import { expect, test } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { delimiter, join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const CSC = 'C:\\Windows\\Microsoft.NET\\Framework64\\v4.0.30319\\csc.exe'
const SHELL_AGENT_START_MS = 5000
const FAKE_GH_SOURCE = [
  'class FakeGh {',
  '  static int Main(string[] args) {',
  '    System.Console.WriteLine("FAKE-GH " + string.Join("|", args));',
  '    return 0;',
  '  }',
  '}'
].join('\r\n')

let app: RunningApp
let fakeFolder: string

test.skip(process.platform !== 'win32' || !existsSync(CSC), 'the fake gh is a Windows program built with the .NET compiler')

test.beforeEach(async () => {
  fakeFolder = await mkdtemp(join(tmpdir(), 'o-bros-fake-gh-'))
  await writeFile(join(fakeFolder, 'FakeGh.cs'), FAKE_GH_SOURCE, 'utf8')
  const built = spawnSync(CSC, ['/nologo', `/out:${join(fakeFolder, 'gh.exe')}`, join(fakeFolder, 'FakeGh.cs')], { windowsHide: true })
  expect(built.status).toBe(0)
  const pathKey = Object.keys(process.env).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH'
  app = await launchApp({ environment: { [pathKey]: `${fakeFolder}${delimiter}${process.env[pathKey] ?? ''}` } })
  await app.window.evaluate((launchers) => {
    localStorage.setItem('o-bros.agentLaunchers', launchers)
    localStorage.setItem('o-bros.shownAgents', JSON.stringify(['shell-agent']))
  }, JSON.stringify([{ id: 'shell-agent', name: 'ShellAgent', command: 'powershell -NoLogo' }]))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
})

test.afterEach(async () => {
  await app.close()
  await rm(fakeFolder, { recursive: true, force: true })
})

async function readProof(fileName: string): Promise<string> {
  const text = await readFile(join(app.projectFolder, fileName), 'utf8').catch(() => '')
  return text.split(/\s+/).join(' ')
}

async function run(command: string, fileName: string): Promise<void> {
  await app.window.locator('.workspace .xterm-helper-textarea').last().focus()
  await app.window.keyboard.type(`${command} 2>&1 | Out-File -Encoding ascii -Width 4096 ${fileName}`)
  await app.window.keyboard.press('Enter')
}

async function startShellAgent(): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByRole('button', { name: 'ShellAgent' }).click()
  await app.window.locator('.workspace .xterm-helper-textarea').first().waitFor({ state: 'attached' })
  await app.window.waitForTimeout(SHELL_AGENT_START_MS)
}

test('asks before an agent changes GitHub with gh, removes its credit lines, and never stops the user', async () => {
  test.setTimeout(150_000)
  await writeFile(join(app.projectFolder, 'body.md'), 'Fixes the login.\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n', 'utf8')
  await startShellAgent()

  await run('gh pr view 1', 'view-proof.txt')
  await expect.poll(() => readProof('view-proof.txt'), { timeout: 30_000 }).toContain('FAKE-GH pr|view|1')

  await run('gh pr merge 1 --squash', 'merge-proof.txt')
  await expect(app.window.getByText('Allow it to run gh pr merge?')).toBeVisible({ timeout: 30_000 })
  await app.window.getByRole('button', { name: 'Cancel' }).click()
  await expect.poll(() => readProof('merge-proof.txt'), { timeout: 30_000 }).toContain('GH_BLOCKED')
  expect(await readProof('merge-proof.txt')).not.toContain('FAKE-GH')

  await run('gh pr create --title Fix --body-file body.md', 'create-proof.txt')
  await expect(app.window.getByText('Allow it to run gh pr create?')).toBeVisible({ timeout: 30_000 })
  await app.window.getByRole('button', { name: 'Allow' }).click()
  await expect.poll(() => readProof('create-proof.txt'), { timeout: 30_000 }).toContain('FAKE-GH pr|create|--title|Fix|--body|Fixes the login.')
  expect(await readProof('create-proof.txt')).not.toContain('Co-Authored-By')

  await run('gh pr comment 1 --body "first`nsecond"', 'cut-proof.txt')
  await expect.poll(() => readProof('cut-proof.txt'), { timeout: 30_000 }).toContain('Windows cut this gh command at its first line break')
  expect(await readProof('cut-proof.txt')).not.toContain('FAKE-GH')

  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.waitForTimeout(SHELL_AGENT_START_MS)
  await run('gh pr merge 2', 'mine-proof.txt')
  await expect.poll(() => readProof('mine-proof.txt'), { timeout: 30_000 }).toContain('FAKE-GH pr|merge|2')

  await app.window.getByTitle('Activity', { exact: true }).click()
  await expect(app.window.locator('.activity-row', { hasText: 'tried to run gh pr merge' }).filter({ hasText: 'Denied' })).toHaveCount(1)
})

test('refuses agent gh changes without asking when set to Never allow on the Integrations page', async () => {
  test.setTimeout(120_000)
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Integrations' }).click()
  await app.window.getByRole('button', { name: 'Never allow' }).click()
  await expect(app.window.getByText('Agents are refused right away')).toBeVisible()
  await app.window.getByTitle('Projects', { exact: true }).click()
  await startShellAgent()

  await run('gh release create v1 --notes ready', 'release-proof.txt')
  await expect.poll(() => readProof('release-proof.txt'), { timeout: 30_000 }).toContain('GH_BLOCKED')
  expect(await readProof('release-proof.txt')).toContain('does not let agents change GitHub or GitLab')
  await expect(app.window.getByText('Allow it to run gh release create?')).toHaveCount(0)

  await run('gh auth status', 'status-proof.txt')
  await expect.poll(() => readProof('status-proof.txt'), { timeout: 30_000 }).toContain('FAKE-GH auth|status')
})
