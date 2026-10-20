import { join } from 'node:path'
import { pathToFileURL } from 'node:url'
import { describe, expect, it, vi } from 'vitest'

const devServer = vi.hoisted(() => ({ url: null as string | null }))
vi.mock('../runMode', () => ({ devServerUrl: () => devServer.url }))

const { isTrustedSender } = await import('./trustedSender')
const appPage = pathToFileURL(join(__dirname, '../renderer/index.html')).href

describe('isTrustedSender', () => {
  it('trusts only the O-BROS page', () => {
    devServer.url = null
    expect(isTrustedSender(appPage)).toBe(true)
    expect(isTrustedSender(appPage + '#settings')).toBe(true)
    expect(isTrustedSender('https://example.com/')).toBe(false)
    expect(isTrustedSender('file:///C:/somewhere/else/index.html')).toBe(false)
    expect(isTrustedSender('http://localhost:5173/')).toBe(false)
    expect(isTrustedSender(null)).toBe(false)
    expect(isTrustedSender(undefined)).toBe(false)
  })

  it('also trusts the dev server when running from source', () => {
    devServer.url = 'http://localhost:5173'
    expect(isTrustedSender('http://localhost:5173/')).toBe(true)
    expect(isTrustedSender('https://example.com/')).toBe(false)
  })
})
