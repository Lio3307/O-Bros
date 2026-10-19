import { describe, expect, it } from 'vitest'
import { groupRepositoriesByFolder } from './repositoryGroups'
import type { RepositoryEntry } from './types'

function entry(relativePath: string): RepositoryEntry {
  return { name: relativePath, path: `E:/Company/${relativePath}`, branch: 'main', relativePath }
}

describe('groupRepositoriesByFolder', () => {
  it('shows nested repositories as one folder each, before the repositories found directly', () => {
    const items = groupRepositoriesByFolder([entry('dmi'), entry('Old/Site'), entry('Old/deep/App'), entry('Archive/x')])
    expect(items).toEqual([
      { kind: 'folder', name: 'Archive', repositoryCount: 1 },
      { kind: 'folder', name: 'Old', repositoryCount: 2 },
      { kind: 'repository', repository: entry('dmi') }
    ])
  })
})
