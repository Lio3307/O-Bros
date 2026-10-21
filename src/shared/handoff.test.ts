import { describe, expect, it } from 'vitest'
import { buildHandoff, MAX_HANDOFF_CHARS, type HandoffInput, type HandoffPart } from './handoff'

function handoffText(input: HandoffInput): string {
  return buildHandoff(input).text
}

function part(agentName: string, messages: [('user' | 'assistant'), string][]): HandoffPart {
  return {
    agentName,
    title: `${agentName} chat`,
    updatedAt: Date.UTC(2026, 9, 21, 9, 15),
    messages: messages.map(([role, text]) => ({ role, text })),
    recordPath: `E:/history/${agentName.toLowerCase()}-resume/2026-10-21_x.json`
  }
}

describe('buildHandoff', () => {
  it('starts with the marker and holds the conversation, the copies, the changed files and the next step', () => {
    const text = handoffText({
      marker: '[O-BROS handoff abcd1234-2]',
      cwd: 'E:/work',
      parts: [part('Claude', [['user', 'Fix the login bug'], ['assistant', 'I found the cause in auth.ts.']])],
      changedFiles: ['M src/auth.ts']
    })
    expect(text.startsWith('[O-BROS handoff abcd1234-2]\n')).toBe(true)
    expect(text).toContain('another coding agent (Claude)')
    expect(text).toContain('Working folder: E:/work')
    expect(text).toContain('- E:/history/claude-resume/2026-10-21_x.json')
    expect(text).toContain('### Claude · 2026-10-21 09:15 · Claude chat')
    expect(text).toContain('User: Fix the login bug')
    expect(text).toContain('Claude: I found the cause in auth.ts.')
    expect(text).toContain('- M src/auth.ts')
    expect(text).toContain("Continue from the user's latest request")
  })

  it('shortens long agent answers more than the user messages', () => {
    const text = handoffText({
      marker: 'm',
      cwd: 'E:/work',
      parts: [part('Codex', [['user', 'u'.repeat(2000)], ['assistant', 'a'.repeat(2000)]])],
      changedFiles: []
    })
    expect(text).toContain('User: ' + 'u'.repeat(2000))
    expect(text).not.toContain('a'.repeat(900))
    expect(text).toContain('[…]')
    expect(text).toContain('(none, or the folder is not a git repository)')
  })

  it('keeps older user requests over many short agent lines, with their headings, within the limit', () => {
    const messages: [('user' | 'assistant'), string][] = []
    for (let request = 0; request < 12; request += 1) {
      messages.push(['user', `REQUEST ${request} ` + 'r'.repeat(300)])
      for (let step = 0; step < 60; step += 1) {
        messages.push(['assistant', `progress ${request}.${step} ` + 'p'.repeat(150)])
      }
    }
    const text = handoffText({ marker: 'm', cwd: 'E:/work', parts: [part('Claude', messages)], changedFiles: [] })
    expect(text.length).toBeLessThanOrEqual(MAX_HANDOFF_CHARS)
    for (let request = 0; request < 12; request += 1) {
      expect(text).toContain(`User: REQUEST ${request} `)
    }
    expect(text.indexOf('### Claude')).toBeLessThan(text.indexOf('User: REQUEST 0 '))
    expect(text).toContain('progress 11.59')
  })

  it('keeps the original goal and the newest messages when the conversation is too long', () => {
    const middle: [('user' | 'assistant'), string][] = Array.from({ length: 80 }, (_, index) => ['user', `step ${index} ` + 'x'.repeat(2500)])
    const text = handoffText({
      marker: 'm',
      cwd: 'E:/work',
      parts: [part('Claude', [['user', 'ORIGINAL GOAL'], ...middle]), part('Codex', [['user', 'LATEST REQUEST']])],
      changedFiles: []
    })
    expect(text.length).toBeLessThanOrEqual(MAX_HANDOFF_CHARS)
    expect(text).toContain('User: ORIGINAL GOAL')
    expect(text).toContain('User: LATEST REQUEST')
    expect(text).not.toContain('step 0 ')
    expect(text).toContain('left out to keep this short')
  })
})
