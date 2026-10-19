import { describe, expect, it } from 'vitest'
import { summarizeOperation } from './gitOperation'

describe('summarizeOperation', () => {
  it('names the merge and counts the files left', () => {
    const summary = summarizeOperation({ kind: 'merge', incoming: 'feature-x' }, 3)
    expect(summary?.title).toBe('Merging feature-x')
    expect(summary?.detail).toContain('3 files have conflicts.')
    expect(summary?.continueLabel).toBe('Commit merge')
  })

  it('says to continue once every conflict is resolved', () => {
    expect(summarizeOperation({ kind: 'rebase', incoming: null }, 0)?.detail).toBe(
      'All conflicts are resolved. Continue to finish the rebase.'
    )
    expect(summarizeOperation({ kind: 'cherryPick', incoming: 'Fix login' }, 1)?.title).toBe('Cherry-picking “Fix login”')
  })

  it('shows conflicts left by a stash without a continue button, and nothing when all is clear', () => {
    expect(summarizeOperation(null, 1)).toMatchObject({ title: 'Conflicts', continueLabel: null })
    expect(summarizeOperation(null, 0)).toBeNull()
  })
})
