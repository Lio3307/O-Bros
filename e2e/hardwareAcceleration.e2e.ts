import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const SETTLE_MS = 4000

async function privateMemoryByType(app: RunningApp): Promise<Record<string, number>> {
  await app.window.waitForTimeout(SETTLE_MS)
  return app.application.evaluate(({ app: electronApp }) => {
    const totals: Record<string, number> = {}
    for (const metric of electronApp.getAppMetrics()) {
      totals[metric.type] = (totals[metric.type] ?? 0) + Math.round((metric.memory.privateBytes ?? 0) / 1024)
    }
    return totals
  })
}

test('turns the graphics card off after a restart and offers the restart', async () => {
  test.setTimeout(120_000)
  const withGpu = await launchApp()
  const memoryWithGpu = await privateMemoryByType(withGpu)
  await withGpu.window.getByTitle('Settings').click()
  await withGpu.window.locator('.side-panel').getByRole('button', { name: 'Storage and memory' }).click()
  const toggle = withGpu.window.getByText('Use the graphics card (hardware acceleration)')
  await toggle.scrollIntoViewIfNeeded()
  await toggle.click()
  await expect(withGpu.window.getByRole('button', { name: 'Restart now' })).toBeVisible()
  await expect(withGpu.window.getByText('The graphics card will be turned off after O-BROS restarts.')).toBeVisible()
  await withGpu.close()

  const withoutGpu = await launchApp({ settings: { useHardwareAcceleration: false } })
  try {
    expect(await withoutGpu.application.evaluate(({ app: electronApp }) => electronApp.isHardwareAccelerationEnabled())).toBe(false)
    const memoryWithoutGpu = await privateMemoryByType(withoutGpu)
    console.log('private MB with graphics card', JSON.stringify(memoryWithGpu))
    console.log('private MB without graphics card', JSON.stringify(memoryWithoutGpu))
  } finally {
    await withoutGpu.close()
  }
})
