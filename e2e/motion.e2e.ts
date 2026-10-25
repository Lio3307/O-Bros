import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

function paletteAnimation() {
  return app.window.evaluate(() => {
    const panel = document.querySelector('.quick-open')
    const animation = panel?.getAnimations().find((candidate) => candidate instanceof CSSAnimation && candidate.animationName === 'motion-dialog')
    return animation === undefined ? null : Number(animation.effect?.getComputedTiming().duration ?? 0)
  })
}

test('dialogs ease in, and stay instant when the system asks for reduced motion', async () => {
  app = await launchApp({ separateHome: true })

  await app.window.keyboard.press('ControlOrMeta+Shift+P')
  await expect(app.window.locator('.quick-open')).toBeVisible()
  const duration = await paletteAnimation()
  expect(duration).toBeGreaterThanOrEqual(200)
  await app.window.keyboard.press('Escape')

  await app.window.emulateMedia({ reducedMotion: 'reduce' })
  await app.window.keyboard.press('ControlOrMeta+Shift+P')
  await expect(app.window.locator('.quick-open')).toBeVisible()
  const reducedDuration = await paletteAnimation()
  expect(reducedDuration === null || reducedDuration <= 1).toBe(true)
})

test('folders open with a rotating arrow instead of swapping icons', async () => {
  app = await launchApp({ separateHome: true })
  const rootChevron = app.window.locator('.root-header .disclosure-chevron').first()
  await expect(rootChevron).toHaveClass(/disclosure-chevron-open/)
  await app.window.locator('.root-header').getByTitle('Show or hide folders').first().click()
  await expect(rootChevron).not.toHaveClass(/disclosure-chevron-open/)
})
