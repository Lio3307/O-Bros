import { describe, expect, it } from 'vitest'
import { agentHintsFrom, mentionsAgent, parseCommitLog, stripAgentCredits, traceOfCommit, type CommitRecord } from './agentTraces'

const HINTS = agentHintsFrom(['Claude Agent', 'claude', 'Codex CLI', 'codex', 'Gemini CLI', 'Devin', 'Copilot', 'fast-agent'])

function commit(changes: Partial<CommitRecord>): CommitRecord {
  return {
    hash: 'abcdef1234567',
    authorName: 'Lio',
    authorEmail: 'lio@example.com',
    committerName: 'Lio',
    committerEmail: 'lio@example.com',
    message: 'Fix login',
    ...changes
  }
}

describe('agentHintsFrom', () => {
  it('keeps full and short names and useful words, and drops generic words', () => {
    expect(HINTS.names).toContain('claude agent')
    expect(HINTS.names).toContain('claude')
    expect(HINTS.names).toContain('codex')
    expect(HINTS.words).toContain('claude')
    expect(HINTS.words).not.toContain('fast')
    expect(HINTS.words).not.toContain('agent')
  })
})

describe('mentionsAgent', () => {
  it('matches whole words only', () => {
    expect(mentionsAgent('claude/fix-login', HINTS)).toBe(true)
    expect(mentionsAgent('feature/claudette-page', HINTS)).toBe(false)
  })
})

describe('traceOfCommit', () => {
  it('finds an agent co-author line', () => {
    const trace = traceOfCommit(commit({ message: 'Fix login\n\nCo-Authored-By: Claude <noreply@anthropic.com>' }), HINTS)
    expect(trace?.reasons).toEqual(['Co-Authored-By: Claude <noreply@anthropic.com>'])
  })

  it('finds an agent author by bot email', () => {
    const trace = traceOfCommit(commit({ authorName: 'Copilot', authorEmail: '198982749+Copilot@users.noreply.github.com' }), HINTS)
    expect(trace?.reasons[0]).toContain('author is Copilot')
  })

  it('does not flag a person whose name only contains an agent word', () => {
    expect(traceOfCommit(commit({ authorName: 'Devin Smith', authorEmail: 'devin@company.com' }), HINTS)).toBeNull()
    expect(traceOfCommit(commit({ message: 'Pair work\n\nCo-Authored-By: Devin Smith <devin@company.com>' }), HINTS)).toBeNull()
    expect(traceOfCommit(commit({}), HINTS)).toBeNull()
  })
})

describe('stripAgentCredits', () => {
  it('removes agent co-author and generated-with lines and the blank lines they leave', () => {
    const message =
      'Fix login\n\nExplain the fix.\n\n🤖 Generated with [Claude Code](https://claude.com/claude-code)\n\nCo-Authored-By: Claude <noreply@anthropic.com>\n'
    expect(stripAgentCredits(message, HINTS)).toBe('Fix login\n\nExplain the fix.')
  })

  it('keeps human co-authors', () => {
    const message = 'Pair work\n\nCo-Authored-By: Sam <sam@example.com>'
    expect(stripAgentCredits(message, HINTS)).toBe(message)
  })
})

describe('parseCommitLog', () => {
  it('splits records and fields', () => {
    const output = 'h1\u001fA\u001fa@x\u001fC\u001fc@x\u001fSubject\n\nBody\n\u001e\nh2\u001fB\u001fb@x\u001fD\u001fd@x\u001fOther\u001e'
    const commits = parseCommitLog(output)
    expect(commits).toHaveLength(2)
    expect(commits[0]).toEqual({
      hash: 'h1',
      authorName: 'A',
      authorEmail: 'a@x',
      committerName: 'C',
      committerEmail: 'c@x',
      message: 'Subject\n\nBody'
    })
  })
})
