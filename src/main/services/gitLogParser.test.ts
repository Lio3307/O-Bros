import { describe, expect, it } from 'vitest'
import { isCommitHash, parseGitLog } from './gitLogParser'

const US = '\x1f'
const RS = '\x1e'

function record(parts: string[]): string {
  return parts.join(US) + RS
}

describe('parseGitLog', () => {
  it('reads hash, parents, author, time, refs and subject', () => {
    const output = record([
      'a'.repeat(40),
      'b'.repeat(40),
      'Ada',
      '1700000000',
      'HEAD -> main, origin/main, tag: v0.1.0',
      'Fix the split'
    ])

    const [commit] = parseGitLog(output)

    expect(commit.hash).toBe('a'.repeat(40))
    expect(commit.shortHash).toBe('aaaaaaa')
    expect(commit.parents).toEqual(['b'.repeat(40)])
    expect(commit.author).toBe('Ada')
    expect(commit.authoredAt).toBe(1_700_000_000_000)
    expect(commit.refs).toEqual(['main', 'origin/main', 'tag: v0.1.0'])
    expect(commit.subject).toBe('Fix the split')
  })

  it('reads several commits, a merge with two parents and a commit with no refs', () => {
    const output =
      record(['1'.repeat(40), `${'2'.repeat(40)} ${'3'.repeat(40)}`, 'Ada', '10', '', 'Merge branch']) +
      '\n' +
      record(['2'.repeat(40), '', 'Bob', '5', '', 'First'])

    const commits = parseGitLog(output)

    expect(commits).toHaveLength(2)
    expect(commits[0].parents).toHaveLength(2)
    expect(commits[0].refs).toEqual([])
    expect(commits[1].parents).toEqual([])
  })

  it('keeps a subject that contains the field separator', () => {
    const output = record(['c'.repeat(40), '', 'Ada', '1', '', `one${US}two`])
    expect(parseGitLog(output)[0].subject).toBe(`one${US}two`)
  })

  it('returns nothing for empty output', () => {
    expect(parseGitLog('')).toEqual([])
  })
})

describe('isCommitHash', () => {
  it('accepts a full or abbreviated hash', () => {
    expect(isCommitHash('a1b2c3d')).toBe(true)
    expect(isCommitHash('a'.repeat(40))).toBe(true)
  })

  it('rejects anything git could read as an option or a path', () => {
    expect(isCommitHash('--output=x')).toBe(false)
    expect(isCommitHash('HEAD~1')).toBe(false)
    expect(isCommitHash('abc')).toBe(false)
    expect(isCommitHash('zzzzzzz')).toBe(false)
  })
})
