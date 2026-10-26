import { expect, test } from '@playwright/test'
import { launchApp, type RunningApp } from './launchApp'

const GROK_TOKEN = 'fake-grok-token-123'
const CLINE_TOKEN = 'fake-cline-token-456'
const HOUR_MS = 60 * 60 * 1000
const FAKE_FREEBUFF: Record<string, string> = process.platform === 'win32' ? { 'freebuff.cmd': '@echo off\r\n' } : { freebuff: '#!/bin/sh\n' }

let app: RunningApp

test.afterEach(async () => {
  await app.close()
})

interface FakeAnswers {
  grok: unknown
  cline: unknown
}

async function answerUsageRequests(answers: FakeAnswers): Promise<void> {
  await app.application.evaluate((_electron, fake) => {
    const realFetch = globalThis.fetch
    const calls: { url: string; authorization: string | null; grokHeader: string | null }[] = []
    Object.assign(globalThis, { planUsageCalls: calls })
    globalThis.fetch = async (input: string | URL | Request, init?: RequestInit) => {
      const url = String(input)
      const headers = new Headers(init?.headers)
      const answer = url.startsWith('https://cli-chat-proxy.grok.com/') ? fake.grok : url.startsWith('https://api.cline.bot/') ? fake.cline : undefined
      if (answer === undefined) {
        return realFetch(input, init)
      }
      calls.push({ url, authorization: headers.get('authorization'), grokHeader: headers.get('x-xai-token-auth') })
      return new Response(JSON.stringify(answer), { status: 200, headers: { 'content-type': 'application/json' } })
    }
  }, answers)
}

test('shows Grok and ClinePass plan limits from their own sign-ins, and never shows the token', async () => {
  test.setTimeout(90_000)
  const now = Date.now()
  app = await launchApp({
    separateHome: true,
    binFiles: FAKE_FREEBUFF,
    homeFiles: {
      '.grok/auth.json': JSON.stringify({ 'https://auth.x.ai::client': { key: GROK_TOKEN, expires_at: new Date(now + 48 * HOUR_MS).toISOString() } }),
      '.cline/data/settings/providers.json': JSON.stringify({ providers: { cline: { settings: { auth: { accessToken: CLINE_TOKEN } } } } })
    }
  })
  await answerUsageRequests({
    grok: {
      config: {
        creditUsagePercent: 38,
        subscriptionTier: 'SuperGrok',
        currentPeriod: { start: new Date(now - 72 * HOUR_MS).toISOString(), end: new Date(now + 96 * HOUR_MS).toISOString() }
      }
    },
    cline: {
      success: true,
      data: {
        limits: [
          { type: 'five_hour', percentUsed: 12, resetsAt: new Date(now + 2 * HOUR_MS).toISOString() },
          { type: 'weekly', percentUsed: 64, resetsAt: new Date(now + 50 * HOUR_MS).toISOString() },
          { type: 'monthly', percentUsed: 7, resetsAt: new Date(now + 400 * HOUR_MS).toISOString() }
        ]
      }
    }
  })
  await app.window.reload()
  await app.window.waitForSelector('.rail')

  const usageButton = app.window.locator('.status-usage').first()
  await expect(usageButton).toContainText('64%', { timeout: 20_000 })
  await expect(usageButton).toHaveAttribute('title', /Grok: wk 38%/)
  await expect(usageButton).toHaveAttribute('title', /ClinePass: 5h 12%, wk 64%, mo 7%/)

  await usageButton.click()
  const popover = app.window.getByRole('dialog', { name: 'Usage' })
  await expect(popover.getByText('Grok · SuperGrok')).toBeVisible()
  await expect(popover.getByText('ClinePass', { exact: true })).toBeVisible()
  await expect(popover.locator('.usage-window-percent', { hasText: '38%' })).toBeVisible()

  const calls = await app.application.evaluate(() => (globalThis as Record<string, unknown>).planUsageCalls as { url: string; authorization: string | null; grokHeader: string | null }[])
  expect(calls).toContainEqual({ url: 'https://cli-chat-proxy.grok.com/v1/billing?format=credits', authorization: `Bearer ${GROK_TOKEN}`, grokHeader: 'xai-grok-cli' })
  expect(calls).toContainEqual({ url: 'https://api.cline.bot/api/v1/users/me/plan/usage-limits', authorization: `Bearer workos:${CLINE_TOKEN}`, grokHeader: null })
  const page = await app.window.content()
  expect(page).not.toContain(GROK_TOKEN)
  expect(page).not.toContain(CLINE_TOKEN)

  await app.window.keyboard.press('Escape')
  await app.window.getByTitle('Settings', { exact: true }).click()
  await app.window.locator('.side-panel').getByRole('button', { name: 'Agents' }).click()
  await expect(app.window.getByText('Show Grok plan usage')).toBeVisible()
  await expect(app.window.getByText('Show ClinePass plan usage')).toBeVisible()
  await expect(app.window.getByText(/OpenRouter/)).toHaveCount(0)
  await expect(app.window.locator('.table-row', { hasText: 'Freebuff' })).toBeVisible({ timeout: 20_000 })
  await expect(app.window.getByText(/agents? on this computer, \d+ already in your list/)).toBeVisible()

  await app.window.getByText('Show Grok plan usage').click()
  await expect(usageButton).not.toHaveAttribute('title', /Grok:/)
})

test('hides ClinePass for a Cline account without the plan, and says when the Grok sign-in expired', async () => {
  test.setTimeout(60_000)
  app = await launchApp({
    separateHome: true,
    homeFiles: {
      '.grok/auth.json': JSON.stringify({ 'https://auth.x.ai::client': { key: GROK_TOKEN, expires_at: '2020-01-01T00:00:00Z' } }),
      '.cline/data/settings/providers.json': JSON.stringify({ providers: { cline: { settings: { auth: { accessToken: CLINE_TOKEN } } } } })
    }
  })
  await answerUsageRequests({ grok: {}, cline: { success: true, data: { limits: [] } } })
  await app.window.reload()
  await app.window.waitForSelector('.rail')

  const usageButton = app.window.locator('.status-usage').first()
  await expect(usageButton).toHaveAttribute('title', /Grok: unavailable/, { timeout: 20_000 })
  await expect(usageButton).not.toHaveAttribute('title', /ClinePass/)
  await usageButton.click()
  await expect(app.window.getByText('The Grok sign-in has expired. Run grok login again, then Rescan.')).toBeVisible()
  const calls = await app.application.evaluate(() => (globalThis as Record<string, unknown>).planUsageCalls as { url: string }[])
  const calledUrls = calls.map((call) => call.url)
  expect(calledUrls).toContain('https://api.cline.bot/api/v1/users/me/plan/usage-limits')
  expect(calledUrls).not.toContain('https://cli-chat-proxy.grok.com/v1/billing?format=credits')
})
