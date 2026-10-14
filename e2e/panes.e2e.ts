import { expect, test, type Locator } from '@playwright/test'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.beforeEach(async () => {
  app = await launchApp()
})

test.afterEach(async () => {
  await app.close()
})

const isWindows = process.platform === 'win32'

async function openTerminalInProject(): Promise<void> {
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  const input = app.window.locator('.xterm-helper-textarea').last()
  await input.waitFor({ state: 'attached' })
  await input.focus()
}

async function typeLine(text: string): Promise<void> {
  await app.window.keyboard.type(text)
  await app.window.keyboard.press('Enter')
}

async function readTrimmed(fileName: string): Promise<string> {
  const content = await readFile(join(app.projectFolder, fileName), 'utf8').catch(() => '')
  return content.trim()
}

async function openShortcutsPage(): Promise<void> {
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.getByText('Shortcuts', { exact: true }).first().click()
}

function shortcutButton(title: string): Locator {
  return app.window.locator('.table-row', { hasText: title }).locator('.shortcut-key')
}

test('shows the default shortcuts in the pane tooltips', async () => {
  await openShortcutsPage()

  await expect(shortcutButton('Split right')).toHaveText('Ctrl+Shift+D')
  await expect(shortcutButton('Split down')).toHaveText('Ctrl+Shift+E')
  await expect(shortcutButton('Close pane')).toHaveText('Ctrl+Shift+W')
  await expect(shortcutButton('New terminal')).toHaveText('Ctrl+Shift+T')
})

test('records a new shortcut and uses it to split', async () => {
  await openShortcutsPage()
  await shortcutButton('Split right').click()
  await app.window.keyboard.press('Control+Alt+R')
  await expect(shortcutButton('Split right')).toHaveText('Ctrl+Alt+R')

  await app.window.getByTitle('Projects', { exact: true }).click()
  await openTerminalInProject()
  await app.window.keyboard.press('Control+Alt+R')

  await expect(app.window.locator('.pane-frame')).toHaveCount(2)
})

test('refuses a shortcut that is already used and keeps the old one', async () => {
  await openShortcutsPage()
  await shortcutButton('Split right').click()
  await app.window.keyboard.press('Control+P')

  await expect(app.window.getByText('already used for copy, paste, save, search or quick open')).toBeVisible()
  await app.window.keyboard.press('Escape')
  await expect(shortcutButton('Split right')).toHaveText('Ctrl+Shift+D')
})

test('closing one pane leaves the other terminal running with its state', async () => {
  await openTerminalInProject()
  await typeLine(isWindows ? "$env:PANE_STATE='alive'" : 'export PANE_STATE=alive')

  await app.window.keyboard.press('Control+Shift+D')
  await expect(app.window.locator('.pane-frame')).toHaveCount(2)
  await app.window.keyboard.press('Control+Shift+W')
  await expect(app.window.locator('.pane-frame')).toHaveCount(1)

  await app.window.locator('.xterm-helper-textarea').first().focus()
  await typeLine(isWindows ? '$env:PANE_STATE | Out-File -Encoding ascii state.txt' : 'echo $PANE_STATE > state.txt')

  await expect.poll(() => readTrimmed('state.txt'), { timeout: 20_000 }).toBe('alive')
})

test('dragging the divider changes the size of the panes', async () => {
  await openTerminalInProject()
  await app.window.keyboard.press('Control+Shift+D')
  await expect(app.window.locator('.pane-slot')).toHaveCount(2)

  const firstSlot = app.window.locator('.pane-slot').first()
  const widthBefore = (await firstSlot.boundingBox())?.width ?? 0
  const divider = await app.window.locator('.pane-divider').first().boundingBox()
  if (divider === null) {
    throw new Error('divider not found')
  }

  const startX = divider.x + divider.width / 2
  const startY = divider.y + divider.height / 2
  await app.window.mouse.move(startX, startY)
  await app.window.mouse.down()
  await app.window.mouse.move(startX + 150, startY, { steps: 5 })
  await app.window.mouse.up()

  await expect
    .poll(async () => (await firstSlot.boundingBox())?.width ?? 0)
    .toBeGreaterThan(widthBefore + 100)
})

test('keeps each terminal inside its own pane after a split', async () => {
  await openTerminalInProject()
  await app.window.keyboard.press('Control+Shift+D')
  await expect(app.window.locator('.pane-slot')).toHaveCount(2)

  const slots = app.window.locator('.pane-slot')
  for (let index = 0; index < 2; index += 1) {
    await expect
      .poll(
        async () => {
          const slotBox = await slots.nth(index).boundingBox()
          const screenBox = await slots.nth(index).locator('.xterm-screen').boundingBox()
          if (slotBox === null || screenBox === null) {
            return -9999
          }
          return Math.round(slotBox.x + slotBox.width - (screenBox.x + screenBox.width))
        },
        { message: `pane ${index}: pixels left between the terminal and its pane's right edge`, timeout: 10_000 }
      )
      .toBeGreaterThanOrEqual(0)
  }
})
