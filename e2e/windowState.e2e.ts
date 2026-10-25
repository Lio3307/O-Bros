import { expect, test } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

const SAVE_DELAY_MS = 500

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

function windowFacts() {
  return app.application.evaluate(({ BrowserWindow }) => {
    const window = BrowserWindow.getAllWindows()[0]
    return { bounds: window.getContentBounds(), isMaximized: window.isMaximized() }
  })
}

test('opens maximized again when it was closed maximized', async () => {
  app = await launchApp({ userDataFiles: { 'window-state.json': JSON.stringify({ bounds: { x: 60, y: 40, width: 1000, height: 700 }, isMaximized: true }) } })
  await expect.poll(async () => (await windowFacts()).isMaximized).toBe(true)
})

test('opens at the size and place it was closed with, and saves changes', async () => {
  app = await launchApp({ userDataFiles: { 'window-state.json': JSON.stringify({ bounds: { x: 60, y: 40, width: 1000, height: 700 } }) } })
  const opened = await windowFacts()
  expect(opened.isMaximized).toBe(false)
  expect(opened.bounds).toMatchObject({ y: 40, width: 1000, height: 700 })
  expect(Math.abs(opened.bounds.x - 60)).toBeLessThanOrEqual(1)

  await app.application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].setContentBounds({ x: 80, y: 60, width: 1100, height: 720 }))
  const stateFile = join(dirname(app.projectFolder), 'user-data', 'window-state.json')
  const savedBounds = async () => JSON.parse(await readFile(stateFile, 'utf8').catch(() => '{}')).bounds ?? {}
  await expect.poll(savedBounds, { timeout: SAVE_DELAY_MS * 10 }).toMatchObject({ y: 60, width: 1100, height: 720 })
  expect(Math.abs((await savedBounds()).x - 80)).toBeLessThanOrEqual(1)

  await app.application.evaluate(({ BrowserWindow }) => BrowserWindow.getAllWindows()[0].maximize())
  await expect.poll(async () => JSON.parse(await readFile(stateFile, 'utf8')).isMaximized, { timeout: SAVE_DELAY_MS * 10 }).toBe(true)
  expect(await savedBounds()).toMatchObject({ width: 1100, height: 720 })
})
