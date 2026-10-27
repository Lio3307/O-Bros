import { expect, test } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.APPEARANCE_SHOTS
const LONG_VALUE = 'sha512-'.padEnd(400, 'x')
const LOCK = `{\n  "lockfileVersion": 2,\n  "workspaces": {\n    "": {\n      "name": "learn-svelte",\n    },\n  },\n  "packages": {\n    "@jridgewell/gen-mapping": ["@jridgewell/gen-mapping@0.3.13", "", {}, "${LONG_VALUE}"],\n  }\n}\n`

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('line numbers stay readable when long lines scroll sideways, and fold arrows show on hover', async () => {
  app = await launchApp()
  await writeFile(join(app.projectFolder, 'bun.lock'), LOCK, 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('bun.lock')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await expect(app.window.locator('.cm-content')).toContainText('lockfileVersion')

  await app.window.locator('.cm-scroller').evaluate((scroller) => {
    scroller.scrollLeft = 300
  })
  const gutterAlpha = await app.window.locator('.cm-gutters').evaluate((gutters) => {
    const color = getComputedStyle(gutters).backgroundColor
    const inside = color.slice(color.indexOf('(') + 1, color.lastIndexOf(')'))
    const parts = inside.includes('/') ? [inside.slice(inside.indexOf('/') + 1)] : inside.split(',').slice(3)
    return parts.length === 0 ? 1 : Number(parts[0])
  })
  expect(gutterAlpha).toBe(1)

  const openArrow = app.window.locator('.cm-fold-marker-open').first()
  await expect(openArrow.locator('svg')).toHaveCount(1)
  await app.window.locator('.cm-content').hover()
  await expect.poll(() => openArrow.evaluate((marker) => Number(getComputedStyle(marker).opacity))).toBe(0)
  await app.window.locator('.cm-lineNumbers').hover()
  await expect.poll(() => openArrow.evaluate((marker) => Number(getComputedStyle(marker).opacity))).toBe(1)
  if (SHOTS !== undefined) {
    await app.window.locator('.cm-editor').screenshot({ path: `${SHOTS}/editor-gutter.png` })
  }

  await openArrow.click()
  await expect(app.window.locator('.cm-foldPlaceholder')).toHaveCount(1)
  const closedArrow = app.window.locator('.cm-fold-marker-closed').first()
  await app.window.locator('.cm-content').hover()
  await expect.poll(() => closedArrow.evaluate((marker) => Number(getComputedStyle(marker).opacity))).toBe(1)
})
