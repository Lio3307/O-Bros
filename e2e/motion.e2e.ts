import { expect, test } from '@playwright/test'
import { mkdir, writeFile } from 'node:fs/promises'
import { join } from 'node:path'
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
  await mkdir(join(app.projectFolder, 'src'))
  const rootChevron = app.window.locator('.root-header .disclosure-chevron').first()
  await expect(rootChevron).toHaveClass(/disclosure-chevron-open/, { timeout: 15_000 })
  await app.window.locator('.root-header').getByTitle('Show or hide folders').first().click()
  await expect(rootChevron).not.toHaveClass(/disclosure-chevron-open/)
})

test('the editor cursor follows the Text cursor settings: shape, color, blink and glide', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('notes.txt')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await app.window.locator('.cm-content').click()
  const cursorLook = () =>
    app.window.evaluate(() => {
      const cursor = document.querySelector('.cm-cursor')
      const layer = document.querySelector('.cm-cursorLayer')
      const style = cursor === null ? null : getComputedStyle(cursor)
      return {
        transition: style?.transitionProperty ?? '',
        borderLeft: style?.borderLeftWidth ?? '',
        width: style?.width ?? '',
        background: style?.backgroundColor ?? '',
        blinkMs: layer === null ? '' : getComputedStyle(layer).animationDuration
      }
    })

  const plain = await cursorLook()
  expect(plain.transition).not.toContain('left')
  expect(plain.borderLeft).toBe('2px')

  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Editor', exact: true }).click()
  await app.window.getByRole('button', { name: 'Block', exact: true }).click()
  await app.window.locator('.cursor-color-pick input[type="color"]').evaluate((input: HTMLInputElement) => {
    const setValue = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value')!.set!
    setValue.call(input, '#ff8800')
    input.dispatchEvent(new Event('input', { bubbles: true }))
  })
  await expect(app.window.getByText('#ff8800')).toBeVisible()
  await app.window.getByText('Blink', { exact: true }).click()
  await app.window.getByText('Smooth movement', { exact: false }).click()
  if (process.env.APPEARANCE_SHOTS !== undefined) {
    await app.window.screenshot({ path: `${process.env.APPEARANCE_SHOTS}/cursor-settings.png` })
  }

  await app.window.getByTitle('Projects', { exact: true }).click()
  await app.window.locator('.cm-content').click()
  await expect.poll(async () => (await cursorLook()).background).toBe('color(srgb 1 0.533333 0 / 0.7)')
  const block = await cursorLook()
  expect(block.borderLeft).toBe('0px')
  expect(Number.parseFloat(block.width)).toBeGreaterThan(4)
  expect(block.blinkMs).toBe('0s')
})


test('smooth movement glides the cursor and the current line when moving, stays instant while typing, and keeps frames smooth', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.evaluate(() => localStorage.setItem('o-bros.editorSettings', JSON.stringify({ cursorGlides: true })))
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await writeFile(join(app.projectFolder, 'long.txt'), Array.from({ length: 400 }, (_, index) => `line ${index} ${'text '.repeat(index % 12)}`).join('\n'), 'utf8')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.keyboard.press('ControlOrMeta+P')
  await app.window.getByPlaceholder('Go to file by name').fill('long.txt')
  await app.window.locator('.quick-open-row').first().waitFor({ state: 'visible' })
  await app.window.keyboard.press('Enter')
  await app.window.locator('.cm-content').click({ position: { x: 40, y: 10 } })

  const caret = app.window.locator('.cm-smoothCaret')
  const line = app.window.locator('.cm-activeLineSlide')
  await expect(caret).toBeVisible()
  await expect(line).toHaveCount(1)
  expect(await caret.evaluate((element) => getComputedStyle(element).transitionProperty)).toContain('transform')
  expect(await app.window.locator('.cm-cursor-primary').evaluate((element) => getComputedStyle(element).visibility)).toBe('hidden')

  const lineTop = () => line.evaluate((element) => new DOMMatrix(getComputedStyle(element).transform).m42)
  const before = await lineTop()
  await app.window.keyboard.press('ArrowDown')
  await expect.poll(lineTop).toBeGreaterThan(before)

  await app.window.keyboard.type('x')
  expect(await caret.evaluate((element) => getComputedStyle(element).transitionDuration)).toBe('0s')
  await app.window.keyboard.press('ArrowDown')
  await expect.poll(() => caret.evaluate((element) => getComputedStyle(element).transitionDuration)).not.toBe('0s')

  await app.window.evaluate(() => {
    const gaps: number[] = []
    let last = performance.now()
    const watch = (now: number) => {
      gaps.push(now - last)
      last = now
      if (gaps.length < 90) {
        requestAnimationFrame(watch)
      }
    }
    requestAnimationFrame(watch)
    Object.assign(window, { frameGaps: gaps })
  })
  for (let step = 0; step < 40; step++) {
    await app.window.keyboard.press('ArrowDown')
    await app.window.waitForTimeout(25)
  }
  await app.window.waitForTimeout(400)
  const gaps = await app.window.evaluate(() => (window as unknown as { frameGaps: number[] }).frameGaps.slice(1))
  console.log('FRAMES longest', Math.round(Math.max(...gaps)), 'ms, average', Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length), 'ms')
  expect(Math.max(...gaps)).toBeLessThan(100)
  await app.window.keyboard.press('ControlOrMeta+Z')
  await app.window.keyboard.press('ControlOrMeta+S')
})
