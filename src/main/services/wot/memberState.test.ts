import { describe, expect, it } from 'vitest'
import { isReadyForInput, memberStateOf, type TerminalFacts } from './memberState'

function facts(changes: Partial<TerminalFacts>): TerminalFacts {
  return {
    startedAt: 0,
    lastOutputAt: null,
    lastInputAt: null,
    hasExited: false,
    isBracketedPaste: false,
    tail: '',
    ...changes
  }
}

describe('memberStateOf', () => {
  it('is starting before the first output and during the start delay', () => {
    expect(memberStateOf(facts({}), 60_000)).toBe('starting')
    expect(memberStateOf(facts({ lastOutputAt: 1000 }), 2000)).toBe('starting')
  })

  it('is working while output keeps coming', () => {
    expect(memberStateOf(facts({ lastOutputAt: 59_000 }), 60_000)).toBe('working')
  })

  it('counts typed input as activity so a task just sent is not idle', () => {
    expect(memberStateOf(facts({ lastOutputAt: 10_000, lastInputAt: 58_000 }), 60_000)).toBe('working')
  })

  it('is idle after a quiet period', () => {
    expect(memberStateOf(facts({ lastOutputAt: 10_000 }), 60_000)).toBe('idle')
  })

  it('is waiting when the last output asks a question', () => {
    expect(memberStateOf(facts({ lastOutputAt: 10_000, tail: 'Do you want to proceed?' }), 60_000)).toBe('waiting')
  })

  it('is exited when the process stopped', () => {
    expect(memberStateOf(facts({ hasExited: true, lastOutputAt: 59_000 }), 60_000)).toBe('exited')
  })
})

describe('isReadyForInput', () => {
  it('waits for the start delay and a short quiet period', () => {
    expect(isReadyForInput(facts({ lastOutputAt: 1000 }), 3000)).toBe(false)
    expect(isReadyForInput(facts({ lastOutputAt: 5000 }), 6000)).toBe(false)
    expect(isReadyForInput(facts({ lastOutputAt: 5000 }), 8000)).toBe(true)
  })

  it('is never ready without output', () => {
    expect(isReadyForInput(facts({}), 60_000)).toBe(false)
  })
})
