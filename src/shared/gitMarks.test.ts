import { describe, expect, it } from 'vitest'
import { gitMarksOf } from './gitMarks'
import type { FileChangeKind, GitFileChange } from './types'

const ROOT = 'E:\\Work\\app'

function change(path: string, kind: FileChangeKind, isStaged = false): GitFileChange {
  return { path, kind, isStaged, addedLines: 0, removedLines: 0 }
}

describe('gitMarksOf', () => {
  it('marks changed, new and deleted files by their full path', () => {
    const marks = gitMarksOf([change('src/a.ts', 'modified'), change('notes.md', 'untracked'), change('src/old.ts', 'deleted')], ROOT, true)
    expect(marks.fileKinds.get('e:/work/app/src/a.ts')).toBe('modified')
    expect(marks.fileKinds.get('e:/work/app/notes.md')).toBe('untracked')
    expect(marks.fileKinds.get('e:/work/app/src/old.ts')).toBe('deleted')
  })

  it('marks every folder that holds a change with its strongest change, but not the root', () => {
    const marks = gitMarksOf([change('src/ui/button.ts', 'modified'), change('src/new.ts', 'added')], ROOT, true)
    expect(marks.folderKinds.get('e:/work/app/src/ui')).toBe('modified')
    expect(marks.folderKinds.get('e:/work/app/src')).toBe('added')
    expect(marks.folderKinds.has('e:/work/app')).toBe(false)
  })

  it('lists deleted files under their folder once, so the tree can still show them', () => {
    const marks = gitMarksOf([change('src/old.ts', 'deleted', true), change('src/old.ts', 'deleted', false)], ROOT, true)
    expect(marks.deletedByFolder.get('e:/work/app/src')).toEqual([{ name: 'old.ts', path: 'E:\\Work\\app\\src\\old.ts' }])
  })

  it('keeps the stronger kind when a file is both staged and changed again', () => {
    const marks = gitMarksOf([change('a.ts', 'added', true), change('a.ts', 'modified')], ROOT, true)
    expect(marks.fileKinds.get('e:/work/app/a.ts')).toBe('added')
  })

  it('works with forward slashes on macOS and Linux', () => {
    const marks = gitMarksOf([change('lib/x.rs', 'modified')], '/home/me/app', false)
    expect(marks.fileKinds.get('/home/me/app/lib/x.rs')).toBe('modified')
    expect(marks.folderKinds.get('/home/me/app/lib')).toBe('modified')
  })
})
