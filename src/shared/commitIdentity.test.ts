import { describe, expect, it } from 'vitest'
import { identityEnvironment, isValidCommitIdentity } from './commitIdentity'

describe('isValidCommitIdentity', () => {
  it('needs a name and an email address', () => {
    expect(isValidCommitIdentity({ name: 'Lio', email: '12345+lio@users.noreply.github.com' })).toBe(true)
    expect(isValidCommitIdentity({ name: '', email: 'a@b.c' })).toBe(false)
    expect(isValidCommitIdentity({ name: 'Lio', email: 'not an email' })).toBe(false)
    expect(isValidCommitIdentity(null)).toBe(false)
  })
})

describe('identityEnvironment', () => {
  it('sets both author and committer', () => {
    expect(identityEnvironment({ name: ' Lio ', email: 'lio@example.com ' })).toEqual({
      GIT_AUTHOR_NAME: 'Lio',
      GIT_AUTHOR_EMAIL: 'lio@example.com',
      GIT_COMMITTER_NAME: 'Lio',
      GIT_COMMITTER_EMAIL: 'lio@example.com'
    })
  })

  it('sets nothing for a missing identity', () => {
    expect(identityEnvironment(null)).toEqual({})
  })
})
