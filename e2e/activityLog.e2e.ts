import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

test('searches, filters and pages through the log', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle('Activity', { exact: true }).click()
  await expect(app.window.locator('.activity-log-tools')).toHaveCount(0)
  await expect(app.window.getByText('Nothing yet.', { exact: false })).toBeVisible({ timeout: 15_000 })

  await app.application.evaluate(({ BrowserWindow }) => {
    const now = Date.now()
    for (let index = 0; index < 60; index += 1) {
      const isGit = index % 20 === 0
      BrowserWindow.getAllWindows()[0].webContents.send('activity:added', {
        id: `fake-${index}`,
        at: now - index * 1000,
        kind: isGit ? 'git' : 'session',
        agentCommand: 'fakeagent',
        folder: null,
        text: isGit ? `tried to commit number ${index}` : `started number ${index}`,
        detail: null,
        outcome: null,
        durationMs: null
      })
    }
  })

  const rows = app.window.locator('.activity-row')
  const pages = app.window.getByRole('navigation', { name: 'Pages' })
  const next = pages.getByRole('button', { name: 'Next page' })
  const previous = pages.getByRole('button', { name: 'Previous page' })
  await expect(rows).toHaveCount(25)
  await expect(rows.first()).toContainText('tried to commit number 0')
  await expect(pages).toContainText('1–25 of 60')
  await expect(previous).toBeDisabled()

  await next.click()
  await next.click()
  await expect(pages).toContainText('51–60 of 60')
  await expect(rows).toHaveCount(10)
  await expect(next).toBeDisabled()

  const search = app.window.getByPlaceholder('Search the log')
  await search.pressSequentially('number 1')
  await expect(rows.first()).toContainText('number 1')
  await expect(rows).toHaveCount(15)
  await expect(pages).toHaveCount(0)

  await search.fill('nothing like this')
  await expect(app.window.getByText('No log entries match that.')).toBeVisible()
  await app.window.getByRole('button', { name: 'Clear the search' }).click()
  await expect(search).toHaveValue('')
  await expect(rows).toHaveCount(25)
})
