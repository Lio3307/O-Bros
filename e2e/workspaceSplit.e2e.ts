import { expect, test, type Locator } from '@playwright/test'
import { writeFile } from 'node:fs/promises'
import { join } from 'node:path'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

const SHOTS = process.env.SPLIT_SHOTS

test.beforeEach(async () => {
  app = await launchApp()
  await writeFile(join(app.projectFolder, 'first.txt'), 'first file\n')
  await writeFile(join(app.projectFolder, 'second.txt'), 'second file\n')
  await app.window.getByTitle(app.projectFolder, { exact: true }).click()
  await app.window.getByTitle('Plain terminal in the selected folder').click()
  await app.window.locator('.xterm-helper-textarea').last().waitFor({ state: 'attached' })
})

test.afterEach(async () => {
  await app.close()
})

function tab(name: string): Locator {
  return app.window.locator('.tab', { hasText: name })
}

function sides(): Locator {
  return app.window.locator('.tab-content-side')
}

async function openFile(name: string): Promise<void> {
  await app.window.locator('.files-panel').getByText(name, { exact: true }).click()
  await expect(tab(name)).toHaveClass(/tab-active/)
}

async function dropOnSide(dragged: Locator, side: 'right' | 'bottom' | 'center'): Promise<void> {
  const area = app.window.locator('.workspace-content')
  const box = await area.boundingBox()
  if (box === null) {
    throw new Error('The work area is not visible')
  }
  const position = {
    right: { x: box.width - 20, y: box.height / 2 },
    bottom: { x: box.width / 2, y: box.height - 20 },
    center: { x: box.width / 2, y: box.height / 2 }
  }[side]
  await dragged.hover()
  await app.window.mouse.down()
  await app.window.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 5 })
  await expect(app.window.locator('.split-drop-overlay')).toBeVisible()
  await app.window.mouse.move(box.x + position.x, box.y + position.y, { steps: 5 })
  await expect(app.window.locator('.split-drop-overlay')).toHaveAttribute('data-side', side)
  if (SHOTS !== undefined) {
    await app.window.waitForTimeout(250)
    await app.window.screenshot({ path: `${SHOTS}/split-dragging-${side}.png` })
  }
  await app.window.mouse.up()
}

async function openFilesPanel(): Promise<void> {
  if ((await app.window.locator('.files-panel').count()) === 0) {
    await app.window.getByTitle('Toggle files panel').click()
  }
}

test('dragging a tab to a side shows it next to the terminal, and new files stay on the editor side', async () => {
  await openFilesPanel()
  const terminalTab = tab('sample-project')
  await openFile('first.txt')
  await terminalTab.click()

  await dropOnSide(tab('first.txt'), 'right')
  await expect(sides()).toHaveCount(2)
  const [left, right] = await Promise.all([sides().nth(0).boundingBox(), sides().nth(1).boundingBox()])
  expect(left?.x).toBeLessThan(right?.x ?? 0)
  await expect(app.window.locator('.cm-content')).toContainText('first file')
  await expect(tab('sample-project')).toHaveClass(/tab-beside/)
  await expect(app.window.locator('.split-drop-overlay')).toHaveCount(0)
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/split-editor-terminal.png` })
  }

  await openFile('second.txt')
  await expect(sides()).toHaveCount(2)
  await expect(app.window.locator('.cm-content')).toContainText('second file')
  await expect(app.window.locator('.cm-content')).toHaveCount(1)

  const before = await sides().nth(0).boundingBox()
  const divider = app.window.locator('.workspace-content > .pane-divider')
  await divider.hover()
  await app.window.mouse.down()
  await app.window.mouse.move((before?.x ?? 0) + (before?.width ?? 0) - 150, (before?.y ?? 0) + 200, { steps: 4 })
  await app.window.mouse.up()
  const after = await sides().nth(0).boundingBox()
  expect(after?.width).toBeLessThan(before?.width ?? 0)

  await app.window.waitForTimeout(800)
  await app.window.reload()
  await app.window.waitForSelector('.rail')
  await expect(sides()).toHaveCount(2, { timeout: 15_000 })

  await app.window.getByRole('button', { name: 'Close split' }).click()
  await expect(sides()).toHaveCount(0)
})

test('closing one side of a split shows the other tab alone', async () => {
  await openFilesPanel()
  await openFile('first.txt')
  await tab('sample-project').click()
  await tab('first.txt').click({ button: 'right' })
  await app.window.locator('.popup-menu-item', { hasText: 'Open below' }).click()
  await expect(sides()).toHaveCount(2)
  const [top, bottom] = await Promise.all([sides().nth(0).boundingBox(), sides().nth(1).boundingBox()])
  expect(top?.y).toBeLessThan(bottom?.y ?? 0)

  await tab('first.txt').locator('.tab-close').click()
  await expect(sides()).toHaveCount(0)
  await expect(tab('sample-project')).toHaveClass(/tab-active/)
})

test('a tab dropped in the middle just opens, and reordering tabs still works', async () => {
  await openFilesPanel()
  await openFile('first.txt')
  await tab('sample-project').click()
  await dropOnSide(tab('first.txt'), 'center')
  await expect(sides()).toHaveCount(0)
  await expect(tab('first.txt')).toHaveClass(/tab-active/)

  await tab('first.txt').dragTo(tab('sample-project'), { force: true })
  await expect(app.window.locator('.tab').first()).toContainText('first.txt')
})

test('the split buttons open a terminal next to a file', async () => {
  await openFilesPanel()
  await openFile('first.txt')
  await app.window.getByRole('button', { name: 'Open a terminal to the right' }).click()
  await expect(sides()).toHaveCount(2)
  await expect(app.window.locator('.cm-content')).toContainText('first file')
  await expect(app.window.locator('.tab')).toHaveCount(3)
})

test('a file opens to the side from the Files panel', async () => {
  await openFilesPanel()
  await app.window.locator('.files-panel').getByText('second.txt', { exact: true }).click({ button: 'right' })
  await app.window.locator('.popup-menu-item', { hasText: 'Open to the Side' }).click()
  await expect(sides()).toHaveCount(2)
  await expect(tab('second.txt')).toHaveClass(/tab-active/)
})
