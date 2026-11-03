import { describe, expect, it } from 'vitest'
import { sessionListLimit } from './sessionListLimit'
import { FIRST_LISTED_SESSIONS } from './types'

describe('sessionListLimit', () => {
  it('keeps a sensible number of conversations to list', () => {
    expect(sessionListLimit(550)).toBe(550)
    expect(sessionListLimit(12.7)).toBe(12)
  })

  it('refuses anything that is not a usable number', () => {
    expect(sessionListLimit('all')).toBe(FIRST_LISTED_SESSIONS)
    expect(sessionListLimit(Number.NaN)).toBe(FIRST_LISTED_SESSIONS)
    expect(sessionListLimit(-5)).toBe(1)
    expect(sessionListLimit(Number.MAX_SAFE_INTEGER)).toBe(100_000)
  })
})
