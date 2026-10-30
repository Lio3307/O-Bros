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

test('the problem list of a line with many problems fits on screen, scrolls, and stays still while hovered', async () => {
  app = await launchApp()
  const manyUnused = Array.from({ length: 40 }, (_, index) => `function f${index}(e){}`).join(';')
  await writeFile(join(app.projectFolder, 'bundle.js'), `(function(){${manyUnused}})()\n`, 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('bundle.js')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  const marker = app.window.locator('.cm-lint-marker').first()
  await marker.waitFor({ state: 'visible', timeout: 30_000 })

  await marker.hover()
  const list = app.window.locator('.cm-tooltip-lint')
  await expect(list).toBeVisible()
  await expect.poll(() => list.locator('li').count()).toBeGreaterThan(10)
  await list.evaluate((element) => element.setAttribute('data-first-shown', 'yes'))
  await app.window.waitForTimeout(1500)
  await expect(list).toHaveAttribute('data-first-shown', 'yes')

  const [listBox, markerBox, windowHeight] = await Promise.all([list.boundingBox(), marker.boundingBox(), app.window.evaluate(() => window.innerHeight)])
  expect(listBox?.height ?? 0).toBeLessThanOrEqual(321)
  expect((listBox?.y ?? 0) + (listBox?.height ?? 0)).toBeLessThanOrEqual(windowHeight)
  expect(listBox?.y ?? 0).toBeGreaterThanOrEqual((markerBox?.y ?? 0) + (markerBox?.height ?? 0) - 1)
  expect(await list.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true)
})
