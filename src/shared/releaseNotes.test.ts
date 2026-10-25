import { describe, expect, it } from 'vitest'
import { RELEASES_URL, releaseNotesUrl } from './releaseNotes'

describe('releaseNotesUrl', () => {
  it('links to the page of a version', () => {
    expect(releaseNotesUrl('0.1.8')).toBe(`${RELEASES_URL}/tag/v0.1.8`)
    expect(releaseNotesUrl('1.0.0-beta.2')).toBe(`${RELEASES_URL}/tag/v1.0.0-beta.2`)
  })

  it('falls back to the list for anything that is not a plain version', () => {
    expect(releaseNotesUrl('1.0/../../evil')).toBe(RELEASES_URL)
    expect(releaseNotesUrl('1.0?x=1')).toBe(RELEASES_URL)
    expect(releaseNotesUrl(undefined)).toBe(RELEASES_URL)
    expect(releaseNotesUrl('')).toBe(RELEASES_URL)
  })
})
