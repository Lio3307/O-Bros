import { describe, expect, it } from 'vitest'
import { appendToTail, looksLikeWaitingForInput, stripTerminalControl } from './waitingPrompt'

describe('stripTerminalControl', () => {
  it('removes color and cursor sequences', () => {
    expect(stripTerminalControl('\u001b[1;32mDo you want\u001b[0m to\u001b[2K proceed')).toBe('Do you want to proceed')
  })

  it('removes title sequences', () => {
    expect(stripTerminalControl('\u001b]0;my title\u0007hello')).toBe('hello')
  })
})

describe('looksLikeWaitingForInput', () => {
  it('detects an agent permission question', () => {
    const tail = appendToTail('', '\u001b[1mDo you want to proceed?\u001b[0m\r\n ❯ 1. Yes\r\n   2. No')
    expect(looksLikeWaitingForInput(tail)).toBe(true)
  })

  it('detects a yes or no shell prompt', () => {
    expect(looksLikeWaitingForInput('Overwrite file? [Y/n]')).toBe(true)
  })

  it('ignores normal output', () => {
    expect(looksLikeWaitingForInput('Compiling 12 files... done in 3s')).toBe(false)
  })
})

describe('appendToTail', () => {
  it('keeps only the latest characters', () => {
    expect(appendToTail('', 'a'.repeat(5000)).length).toBe(1200)
  })
})
