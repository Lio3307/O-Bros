import { describe, expect, it } from 'vitest'
import {
  MAX_CONTEXT_CHARS,
  buildCodeMessage,
  buildDiffMessage,
  fenceFor,
  isWithinContextLimit,
  languageHintOf
} from './agentContext'

describe('fenceFor', () => {
  it('uses three backticks for plain text', () => {
    expect(fenceFor('const a = 1')).toBe('```')
  })

  it('is longer than any run of backticks inside the text', () => {
    expect(fenceFor('a ``` b')).toBe('````')
    expect(fenceFor('x `````` y')).toBe('```````')
  })
})

describe('languageHintOf', () => {
  it('returns the extension, or nothing when there is none', () => {
    expect(languageHintOf('src/app/Main.TSX')).toBe('tsx')
    expect(languageHintOf('C:\\work\\run.py')).toBe('py')
    expect(languageHintOf('Makefile')).toBe('')
    expect(languageHintOf('.gitignore')).toBe('')
  })
})

describe('buildCodeMessage', () => {
  it('puts the path, the line range and the code in a fenced block', () => {
    const message = buildCodeMessage({ path: 'src/a.ts', code: 'const a = 1', startLine: 4, endLine: 6 })
    expect(message).toBe('File: src/a.ts (lines 4-6)\n```ts\nconst a = 1\n```')
  })

  it('names a single line and leaves the range out for a whole file', () => {
    expect(buildCodeMessage({ path: 'a.ts', code: 'x', startLine: 7, endLine: 7 })).toContain('(line 7)')
    expect(buildCodeMessage({ path: 'a.ts', code: 'x' })).toBe('File: a.ts\n```ts\nx\n```')
  })

  it('puts the question first and ignores an empty one', () => {
    const withQuestion = buildCodeMessage({ path: 'a.ts', code: 'x', question: ' Why is this slow? ' })
    expect(withQuestion.startsWith('Why is this slow?\n\nFile: a.ts')).toBe(true)
    expect(buildCodeMessage({ path: 'a.ts', code: 'x', question: '  ' }).startsWith('File: a.ts')).toBe(true)
  })

  it('keeps code that contains a fence intact', () => {
    const message = buildCodeMessage({ path: 'README.md', code: 'use ```js``` here' })
    expect(message.startsWith('File: README.md\n````md\n')).toBe(true)
    expect(message.endsWith('\n````')).toBe(true)
  })
})

describe('buildDiffMessage', () => {
  it('wraps the diff and names the file', () => {
    const message = buildDiffMessage({ path: 'a.ts', diff: '@@ -1 +1 @@\n-a\n+b\n', question: 'Review this' })
    expect(message).toBe('Review this\n\nChanges in a.ts:\n```diff\n@@ -1 +1 @@\n-a\n+b\n```')
  })
})

describe('isWithinContextLimit', () => {
  it('allows text up to the limit and refuses more', () => {
    expect(isWithinContextLimit('a'.repeat(MAX_CONTEXT_CHARS))).toBe(true)
    expect(isWithinContextLimit('a'.repeat(MAX_CONTEXT_CHARS + 1))).toBe(false)
  })
})
