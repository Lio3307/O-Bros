import { describe, expect, it } from 'vitest'
import { classifyNewRoot } from './projectRoots'

const roots = ['C:\\Work\\App', 'D:\\Games']

describe('classifyNewRoot', () => {
  it('detects the same folder with different case, slashes and trailing separator', () => {
    expect(classifyNewRoot('c:/work/app/', roots, true)).toEqual({ kind: 'same', matchedRootPath: 'C:\\Work\\App' })
  })

  it('treats a different case as another folder when the system is case sensitive', () => {
    expect(classifyNewRoot('/home/me/App', ['/home/me/app'], false).kind).toBe('new')
  })

  it('accepts a folder inside an existing root as its own project', () => {
    expect(classifyNewRoot('C:\\Work\\App\\src', roots, true)).toEqual({ kind: 'new', matchedRootPath: null })
  })

  it('does not confuse a sibling that shares a name prefix', () => {
    expect(classifyNewRoot('C:\\Work\\App2', roots, true).kind).toBe('new')
  })

  it('accepts a parent of an existing root as new', () => {
    expect(classifyNewRoot('C:\\Work', roots, true).kind).toBe('new')
  })
})
