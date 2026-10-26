import { describe, expect, it } from 'vitest'
import { clineLoginOf, grokLoginOf } from './planLogins'

describe('grokLoginOf', () => {
  it('prefers the SuperGrok sign-in and reads when it expires', () => {
    const login = grokLoginOf({
      'https://accounts.x.ai/sign-in': { key: 'session-token' },
      'https://auth.x.ai::client-1': { key: 'oidc-token', expires_at: '2026-11-01T00:00:00Z' }
    })
    expect(login).toEqual({ token: 'oidc-token', expiresAt: Date.parse('2026-11-01T00:00:00Z') })
  })

  it('falls back to the older session sign-in and skips empty entries', () => {
    expect(grokLoginOf({ 'https://auth.x.ai::client-1': { key: '' }, 'https://accounts.x.ai/sign-in': { key: 'session-token' } })).toEqual({
      token: 'session-token',
      expiresAt: null
    })
    expect(grokLoginOf({})).toBeNull()
    expect(grokLoginOf(null)).toBeNull()
  })
})

describe('clineLoginOf', () => {
  it('uses the Cline account sign-in with its workos prefix', () => {
    expect(clineLoginOf({ providers: { cline: { settings: { auth: { accessToken: 'abc' } } } } })).toEqual({ token: 'workos:abc', expiresAt: null })
    expect(clineLoginOf({ providers: { cline: { settings: { auth: { accessToken: 'workos:abc' } } } } })?.token).toBe('workos:abc')
  })

  it('uses the sign-in that expires last and reads its expiry time', () => {
    const login = clineLoginOf({
      providers: {
        cline: { settings: { auth: { accessToken: 'old', expiresAt: 1_700_000_000_000 } } },
        'cline-pass': { settings: { auth: { accessToken: 'new', expiresAt: 1_800_000_000_000 } } }
      }
    })
    expect(login).toEqual({ token: 'workos:new', expiresAt: 1_800_000_000_000 })
    expect(clineLoginOf({ providers: { cline: { settings: { auth: { accessToken: 'a', expiresAt: 1_800_000_000 } } } } })?.expiresAt).toBe(1_800_000_000_000)
  })

  it('falls back to the ClinePass entry or an API key, and finds nothing without a sign-in', () => {
    expect(clineLoginOf({ providers: { 'cline-pass': { settings: { auth: { accessToken: 'pass' } } } } })?.token).toBe('workos:pass')
    expect(clineLoginOf({ providers: { cline: { settings: { apiKey: 'key' } } } })?.token).toBe('key')
    expect(clineLoginOf({ providers: { anthropic: { settings: { apiKey: 'other' } } } })).toBeNull()
  })
})
