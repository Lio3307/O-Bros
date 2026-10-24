import { describe, expect, it } from 'vitest'
import { appendToTail, isRepaintOfQuestion, looksLikeStillWorking, looksLikeWaitingForInput, stripTerminalControl } from './waitingPrompt'

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

describe('isRepaintOfQuestion', () => {
  const question = appendToTail('', 'WriteFile src/todos.test.ts\r\nAllow this change? Do you want to proceed? (y/n) ')

  it('treats a redraw that ends with the same question as no new activity', () => {
    const repaint = appendToTail(question, '\u001b[H\u001b[2JWriteFile src/todos.test.ts\u001b[2;1HAllow this change? Do you want to proceed? (y/n) \u001b[K')
    expect(isRepaintOfQuestion(question, repaint)).toBe(true)
  })

  it('counts new output after the question', () => {
    expect(isRepaintOfQuestion(question, appendToTail(question, 'y\r\nWriting src/todos.test.ts'))).toBe(false)
  })

  it('counts any output when no question is shown', () => {
    const working = appendToTail('', 'Reading src/todos.ts')
    expect(isRepaintOfQuestion(working, appendToTail(working, 'Reading src/todos.ts'))).toBe(false)
  })
})

describe('looksLikeStillWorking', () => {
  it('sees an agent turn that is still running even when its spinner stopped', () => {
    expect(looksLikeStillWorking('✻ Pondering… (12s · esc to interrupt)\n> ')).toBe(true)
    expect(looksLikeStillWorking('• Working (8s • Esc to interrupt)')).toBe(true)
  })

  it('treats a screen without the marker as done', () => {
    expect(looksLikeStillWorking('Done. The tests pass.\n> ')).toBe(false)
  })
})
