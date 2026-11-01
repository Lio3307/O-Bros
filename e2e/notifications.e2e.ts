import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const DEV_SERVER = `const say = () => console.log('compiling page')
const burst = setInterval(say, 1000)
setTimeout(() => clearInterval(burst), 10000)
setTimeout(() => setInterval(say, 1000), 16000)
setInterval(() => {}, 1000)`
const SLOW_JOB = `let count = 0
const timer = setInterval(() => { console.log('step', ++count); if (count === 10) clearInterval(timer) }, 1000)`

function notices(): Promise<{ title: string; body: string }[]> {
  return app.window.evaluate(() => (window as unknown as { notices: { title: string; body: string }[] }).notices)
}

async function openPlainTerminal(): Promise<void> {
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.waitForTimeout(3000)
}

test.beforeEach(async () => {
  app = await launchApp()
  await writeFile(join(app.projectFolder, 'dev.js'), DEV_SERVER)
  await writeFile(join(app.projectFolder, 'job.js'), SLOW_JOB)
  await app.window.evaluate(() => {
    const seen: { title: string; body: string }[] = []
    ;(window as unknown as { notices: typeof seen }).notices = seen
    window.Notification = class {
      constructor(title: string, options?: NotificationOptions) {
        seen.push({ title, body: options?.body ?? '' })
      }
    } as unknown as typeof Notification
  })
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
})

test.afterEach(async () => {
  await app.close()
})

test('notifies for a command that ended, never for a running dev server or an unsent prompt', async () => {
  test.setTimeout(120_000)
  const tabs = app.window.locator('.tab')
  await openPlainTerminal()
  await openPlainTerminal()
  await expect(tabs).toHaveCount(2)

  await tabs.nth(0).click()
  await app.window.keyboard.type('node dev.js')
  await app.window.keyboard.press('Enter')
  await app.window.waitForTimeout(500)
  await tabs.nth(1).click()
  await app.window.waitForTimeout(24_000)
  expect(await notices()).toEqual([])

  await tabs.nth(0).click()
  await app.window.keyboard.press('Control+c')
  await app.window.waitForTimeout(1500)
  for (const letter of 'a prompt I have not sent yet') {
    await app.window.keyboard.type(letter)
    await app.window.waitForTimeout(350)
  }
  await tabs.nth(1).click()
  await app.window.waitForTimeout(7000)
  expect(await notices()).toEqual([])

  await tabs.nth(0).click()
  await app.window.keyboard.press('Control+c')
  await app.window.keyboard.type('node job.js')
  await app.window.keyboard.press('Enter')
  await app.window.waitForTimeout(500)
  await tabs.nth(1).click()
  await expect.poll(notices, { timeout: 30_000 }).toHaveLength(1)
  const [notice] = await notices()
  expect(notice.title).toBe('Command finished')
  expect(notice.body).toContain('In ')
})
