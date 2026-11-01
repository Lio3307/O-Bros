import { describe, expect, it } from 'vitest'
import { parentFolderHint } from './repositoryScan'

describe('parentFolderHint', () => {
  it('shows nothing when the path only repeats the name', () => {
    expect(parentFolderHint({ name: 'dmi', relativePath: 'dmi' })).toBeUndefined()
  })

  it('shows the parent folders of a nested repository', () => {
    expect(parentFolderHint({ name: 'NevelopWebsite', relativePath: 'Nevelop-Web-Old/NevelopWebsite' })).toBe('Nevelop-Web-Old')
  })
})
