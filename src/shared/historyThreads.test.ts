import { describe, expect, it } from 'vitest'
import { addContinuation, handoffMarker, readThreads, threadOfSession } from './historyThreads'

const source = { agent: 'claude', sessionId: 'claude-1', cwd: 'E:/work', title: 'Fix the login bug', startedAt: 100 }

describe('addContinuation', () => {
  it('starts a thread from the source conversation and adds the new agent as part 2', () => {
    const { threads, thread, marker } = addContinuation([], 'thread-abcdef123', source, {
      agent: 'codex',
      sessionId: null,
      cwd: 'E:/work',
      startedAt: 200
    })
    expect(threads).toHaveLength(1)
    expect(thread.title).toBe('Fix the login bug')
    expect(thread.parts.map((part) => [part.agent, part.sessionId])).toEqual([
      ['claude', 'claude-1'],
      ['codex', null]
    ])
    expect(marker).toBe('[O-BROS handoff thread-a-2]')
    expect(marker.length).toBeLessThanOrEqual(30)
  })

  it('appends to the thread the source already belongs to', () => {
    const first = addContinuation([], 'thread-1', source, { agent: 'codex', sessionId: 'codex-9', cwd: 'E:/work', startedAt: 200 })
    const codexSource = { ...source, agent: 'codex', sessionId: 'codex-9' }
    const second = addContinuation(first.threads, 'thread-2', codexSource, { agent: 'gemini', sessionId: null, cwd: 'E:/work', startedAt: 300 })
    expect(second.threads).toHaveLength(1)
    expect(second.thread.id).toBe('thread-1')
    expect(second.thread.parts.map((part) => part.agent)).toEqual(['claude', 'codex', 'gemini'])
    expect(second.marker).toBe(handoffMarker('thread-1', 3))
    expect(threadOfSession(second.threads, 'claude-1')?.id).toBe('thread-1')
  })
})

describe('readThreads', () => {
  it('keeps only well-formed threads', () => {
    const { threads } = addContinuation([], 'thread-1', source, { agent: 'codex', sessionId: null, cwd: 'E:/work', startedAt: 200 })
    expect(readThreads([...threads, { id: 'broken' }, 5])).toEqual(threads)
    expect(readThreads(null)).toEqual([])
  })
})
