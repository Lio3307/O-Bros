import { describe, expect, it } from 'vitest'
import { DEFAULT_REPOSITORY_SEARCH_DEPTH, repositorySearchDepthOf } from './repositorySearch'

describe('repositorySearchDepthOf', () => {
  it('keeps a supported depth and falls back to the default for anything else', () => {
    expect(repositorySearchDepthOf(5)).toBe(5)
    expect(repositorySearchDepthOf(0)).toBe(DEFAULT_REPOSITORY_SEARCH_DEPTH)
    expect(repositorySearchDepthOf(9)).toBe(DEFAULT_REPOSITORY_SEARCH_DEPTH)
    expect(repositorySearchDepthOf('4')).toBe(DEFAULT_REPOSITORY_SEARCH_DEPTH)
    expect(repositorySearchDepthOf(undefined)).toBe(DEFAULT_REPOSITORY_SEARCH_DEPTH)
  })
})
