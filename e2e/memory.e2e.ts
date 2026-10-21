import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const CYCLES = 4
const TERMINALS_PER_CYCLE = 6
const SETTLE_MS = 2000
const MB = 1024 * 1024
const ALLOWED_RENDERER_GROWTH_MB = 8
const ALLOWED_MAIN_GROWTH_MB = 8

interface MemoryReading {
  rendererHeapMb: number
  mainHeapMb: number
  appWorkingSetMb: number
}

async function readMemory(app: RunningApp): Promise<MemoryReading> {
  await app.window.waitForTimeout(SETTLE_MS)
  const rendererHeap = await app.window.evaluate(() => {
    const collect = (window as unknown as { gc?: () => void }).gc
    collect?.()
    return (performance as unknown as { memory: { usedJSHeapSize: number } }).memory.usedJSHeapSize
  })
  const main = await app.application.evaluate(({ app: electronApp }) => {
    const collect = (globalThis as unknown as { gc?: () => void }).gc
    collect?.()
    const workingSetKb = electronApp.getAppMetrics().reduce((total, metric) => total + metric.memory.workingSetSize, 0)
    return { heap: process.memoryUsage().heapUsed, workingSetKb }
  })
  return {
    rendererHeapMb: rendererHeap / MB,
    mainHeapMb: main.heap / MB,
    appWorkingSetMb: (main.workingSetKb * 1024) / MB
  }
}

async function openTerminal(app: RunningApp, index: number): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  const input = app.window.locator('.xterm-helper-textarea').last()
  await input.waitFor({ state: 'attached' })
  await input.focus()
  await app.window.keyboard.type(`echo memory-check-${index}`)
  await app.window.keyboard.press('Enter')
}

async function closeAllTabs(app: RunningApp): Promise<void> {
  const closeButtons = app.window.getByTitle('Close tab')
  while ((await closeButtons.count()) > 0) {
    await closeButtons.first().click()
    await app.window.waitForTimeout(150)
  }
}

function describe(reading: MemoryReading): string {
  return `renderer heap ${reading.rendererHeapMb.toFixed(1)} MB · main heap ${reading.mainHeapMb.toFixed(1)} MB · app RAM ${reading.appWorkingSetMb.toFixed(0)} MB`
}

test('frees the memory of closed terminals', async () => {
  test.setTimeout(240_000)
  const app = await launchApp({ separateHome: true, extraArgs: ['--js-flags=--expose-gc', '--enable-precise-memory-info'] })
  try {
    const start = await readMemory(app)
    console.log(`start        ${describe(start)}`)
    const afterCycles: MemoryReading[] = []
    for (let cycle = 1; cycle <= CYCLES; cycle += 1) {
      for (let index = 0; index < TERMINALS_PER_CYCLE; index += 1) {
        await openTerminal(app, index)
      }
      const open = await readMemory(app)
      console.log(`cycle ${cycle} open ${describe(open)}`)
      await closeAllTabs(app)
      const closed = await readMemory(app)
      console.log(`cycle ${cycle} shut ${describe(closed)}`)
      afterCycles.push(closed)
    }

    const first = afterCycles[0]
    const last = afterCycles[afterCycles.length - 1]
    expect(last.rendererHeapMb - first.rendererHeapMb).toBeLessThan(ALLOWED_RENDERER_GROWTH_MB)
    expect(last.mainHeapMb - first.mainHeapMb).toBeLessThan(ALLOWED_MAIN_GROWTH_MB)
  } finally {
    await app.close()
  }
})
