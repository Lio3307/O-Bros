import { expect, test } from '@playwright/test'
import { spawnSync } from 'node:child_process'
import { launchApp, type RunningApp } from './launchApp'

const FAKE_TOKEN = 'gho_FAKE0123456789abcdef'

const FAKE_GH = [
  '@echo off',
  'if "%1"=="--version" goto version',
  'if "%1"=="auth" goto auth',
  'exit /b 1',
  ':version',
  'echo gh version 2.63.2 ^(2024-12-05^)',
  'exit /b 0',
  ':auth',
  'echo github.com',
  'echo   Logged in to github.com account octo-tester ^(keyring^)',
  'echo   - Active account: true',
  `echo   - Token: ${FAKE_TOKEN}`,
  'echo   Logged in to github.com account octo-work ^(keyring^)',
  'exit /b 0',
  ''
].join('\r\n')

const FAKE_GLAB = [
  '@echo off',
  'if "%1"=="--version" goto version',
  'echo x gitlab.com has not been authenticated with glab. Run glab auth login gitlab.com to authenticate 1>&2',
  'exit /b 1',
  ':version',
  'echo glab 1.48.0 ^(a1b2c3d^)',
  'exit /b 0',
  ''
].join('\r\n')

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

async function openIntegrations() {
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Integrations' }).click()
}

function card(name: string) {
  return app.window.getByRole('region', { name, exact: true })
}

test('shows GitHub and GitLab sign-in from their own CLIs, never the token, and signs in through a terminal', async () => {
  test.skip(process.platform !== 'win32', 'the fake CLIs are Windows scripts')
  app = await launchApp({ separateHome: true, binFiles: { 'gh.cmd': FAKE_GH, 'glab.cmd': FAKE_GLAB } })
  await openIntegrations()

  const github = card('GitHub')
  await expect(github.getByText('Connected', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(github.getByText('octo-tester', { exact: true })).toBeVisible()
  await expect(github.getByText('octo-work', { exact: true })).toBeVisible()
  await expect(github.getByText('gh 2.63.2 is installed.')).toBeVisible()
  await expect(github.getByRole('button', { name: 'Add another account' })).toBeVisible()
  expect(await app.window.content()).not.toContain(FAKE_TOKEN)

  const gitlab = card('GitLab')
  await expect(gitlab.getByText('Not signed in', { exact: true })).toBeVisible()
  await expect(gitlab.getByText('glab 1.48.0 is installed, but not signed in.', { exact: false })).toBeVisible()
  await gitlab.getByRole('button', { name: 'Sign in' }).click()
  await expect(app.window.locator('.tab', { hasText: 'GitLab sign-in' })).toBeVisible()
})

test('offers to install a missing CLI and opens its download page in the browser', async () => {
  const hasGlab = spawnSync(process.platform === 'win32' ? 'where' : 'which', ['glab'], { windowsHide: true }).status === 0
  test.skip(hasGlab, 'glab is installed on this computer')
  app = await launchApp({ separateHome: true })
  await app.application.evaluate(({ shell }) => {
    const opened: string[] = []
    Object.assign(globalThis, { opened })
    shell.openExternal = async (url: string) => {
      opened.push(url)
    }
  })
  await openIntegrations()

  const gitlab = card('GitLab')
  await expect(gitlab.getByText('Not installed', { exact: true })).toBeVisible({ timeout: 20000 })
  await expect(gitlab.getByText('Install the GitLab CLI', { exact: false })).toBeVisible()
  await gitlab.getByRole('button', { name: 'Download page' }).click()
  await expect
    .poll(() => app.application.evaluate(() => (globalThis as Record<string, unknown>).opened as string[]))
    .toEqual(['https://gitlab.com/gitlab-org/cli#installation'])
  const hasWinget = spawnSync('where', ['winget'], { windowsHide: true }).status === 0
  if (process.platform === 'win32' && hasWinget) {
    await expect(gitlab.getByRole('button', { name: 'Install with winget' })).toBeVisible()
  }
})
