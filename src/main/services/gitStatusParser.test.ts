import { describe, expect, it } from 'vitest'
import { parseNumstat, parseStatusOutput } from './gitStatusParser'

const STATUS_OUTPUT = [
  '# branch.oid 1234567890',
  '# branch.head main',
  '# branch.upstream origin/main',
  '# branch.ab +2 -1',
  '1 M. N... 100644 100644 100644 aaa bbb src/app.tsx',
  '1 .M N... 100644 100644 100644 aaa bbb src/styles.css',
  '1 MM N... 100644 100644 100644 aaa bbb src/both.ts',
  '2 R. N... 100644 100644 100644 aaa bbb R100 src/new-name.ts\tsrc/old-name.ts',
  '? notes.md',
  ''
].join('\n')

describe('parseStatusOutput', () => {
  it('reads branch, upstream and ahead/behind counts', () => {
    const status = parseStatusOutput(STATUS_OUTPUT)
    expect(status.branch).toBe('main')
    expect(status.upstream).toBe('origin/main')
    expect(status.ahead).toBe(2)
    expect(status.behind).toBe(1)
  })

  it('splits a file changed in both areas into two entries', () => {
    const bothEntries = parseStatusOutput(STATUS_OUTPUT).changes.filter((change) => change.path === 'src/both.ts')
    expect(bothEntries).toEqual([
      { path: 'src/both.ts', kind: 'modified', isStaged: true },
      { path: 'src/both.ts', kind: 'modified', isStaged: false }
    ])
  })

  it('keeps the new path of a rename and marks untracked files', () => {
    const { changes } = parseStatusOutput(STATUS_OUTPUT)
    expect(changes).toContainEqual({ path: 'src/new-name.ts', kind: 'renamed', isStaged: true })
    expect(changes).toContainEqual({ path: 'notes.md', kind: 'untracked', isStaged: false })
  })

  it('marks a file with a merge conflict, even with spaces in its name', () => {
    const { changes } = parseStatusOutput('u UU N... 100644 100644 100644 100644 aaa bbb ccc src/my file.ts\n')
    expect(changes).toEqual([{ path: 'src/my file.ts', kind: 'conflicted', isStaged: false }])
  })

  it('has no upstream when the header is missing', () => {
    const status = parseStatusOutput('# branch.head feature\n')
    expect(status.upstream).toBeNull()
    expect(status.ahead).toBe(0)
  })
})

describe('parseNumstat', () => {
  it('maps paths to line counts and treats binary files as zero', () => {
    const counts = parseNumstat('12\t3\tsrc/app.tsx\n-\t-\timage.png\n')
    expect(counts.get('src/app.tsx')).toEqual({ addedLines: 12, removedLines: 3 })
    expect(counts.get('image.png')).toEqual({ addedLines: 0, removedLines: 0 })
  })
})
