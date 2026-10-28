import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const SHOTS = process.env.APPEARANCE_SHOTS

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

function todayAt(hour: number, minute: number): number {
  const time = new Date()
  time.setHours(hour, minute, 0, 0)
  return Math.min(time.getTime(), Date.now())
}

function entry(id: string, at: number, kind: string, extra: Record<string, unknown> = {}) {
  return { id, at, kind, agentCommand: 'claude', folder: null, text: 'started', detail: null, outcome: null, durationMs: null, ...extra }
}

test('the hourly chart says in plain words what happened, by kind, and explains an empty day', async () => {
  const firstHour = Math.max(new Date().getHours() - 1, 0)
  const activity = [
    entry('a', todayAt(firstHour, 1), 'session'),
    entry('b', todayAt(firstHour, 20), 'session', { text: 'closed after 19m', durationMs: 19 * 60_000 }),
    entry('c', todayAt(firstHour, 21), 'git', { outcome: 'allowed', text: 'git push' }),
    entry('d', todayAt(firstHour, 22), 'git', { outcome: 'denied', text: 'git push --force' }),
    entry('e', todayAt(firstHour, 30), 'team', { agentCommand: 'codex', text: 'joined the team as "a"' })
  ]
  app = await launchApp({ separateHome: true, userDataFiles: { 'activity.json': JSON.stringify(activity) } })
  await app.window.getByTitle('Activity', { exact: true }).click()

  const card = app.window.locator('.card', { hasText: 'Today by hour' })
  await expect(card).toContainText('Today: 1 agent session started, 2 git actions, 1 team member summoned')
  await expect(card).not.toContainText('event')
  await expect(card.locator('.hour-legend')).toContainText('Git actions agents asked for')
  await expect(card.locator('.hour-axis-now')).toHaveText('now')

  await card.locator('.hour-slot').nth(firstHour).hover()
  const tooltip = app.window.locator('.cursor-tooltip')
  await expect(tooltip).toContainText(String(firstHour).padStart(2, '0') + ':00')
  await expect(tooltip).toContainText('1 agent session started')
  await expect(tooltip).toContainText('2 git actions')
  await expect(tooltip).toContainText('1 team member summoned')
  const firstBox = await tooltip.boundingBox()
  await expect(card.locator('.hour-slot').nth(firstHour).locator('.hour-part')).toHaveCount(3)
  if (SHOTS !== undefined) {
    await app.window.screenshot({ path: `${SHOTS}/activity-chart.png` })
  }
  await card.locator('.hour-slot').nth((firstHour + 12) % 24).hover()
  await expect(tooltip).toContainText('Nothing happened')
  expect((await tooltip.boundingBox())?.x).not.toBe(firstBox?.x)
  await app.window.locator('.monitor-header').hover()
  await expect(tooltip).toHaveCount(0)
})

test('an empty day explains what will show up instead of drawing empty bars', async () => {
  app = await launchApp({ separateHome: true })
  await app.window.getByTitle('Activity', { exact: true }).click()
  const card = app.window.locator('.card', { hasText: 'Today by hour' })
  await expect(card).toContainText('Nothing yet today.')
  await expect(card.locator('.hour-slot')).toHaveCount(0)
})
