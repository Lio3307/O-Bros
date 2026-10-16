import { describe, expect, it } from 'vitest'
import { findIgnoringCase, makeSnippet } from './searchSnippet'

describe('findIgnoringCase', () => {
  it('finds a word regardless of case', () => {
    expect(findIgnoringCase('Fix the Login bug', 'login')).toBe(8)
  })

  it('returns -1 when the word is missing', () => {
    expect(findIgnoringCase('hello', 'world')).toBe(-1)
  })
})

describe('makeSnippet', () => {
  it('returns short text unchanged', () => {
    expect(makeSnippet('fix the login bug', 8, 5)).toBe('fix the login bug')
  })

  it('adds dots when text is cut and flattens new lines', () => {
    const text = 'a'.repeat(100) + '\nlogin\n' + 'b'.repeat(100)
    const snippet = makeSnippet(text, 101, 5)
    expect(snippet.startsWith('…')).toBe(true)
    expect(snippet.endsWith('…')).toBe(true)
    expect(snippet.includes('\n')).toBe(false)
    expect(snippet.includes('login')).toBe(true)
  })
})
