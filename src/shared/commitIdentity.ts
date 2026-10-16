export interface CommitIdentity {
  name: string
  email: string
}

export function isValidCommitIdentity(identity: CommitIdentity | null): boolean {
  if (identity === null) {
    return false
  }
  const email = identity.email.trim()
  return identity.name.trim() !== '' && email.includes('@') && !email.includes(' ')
}

export function identityEnvironment(identity: CommitIdentity | null): Record<string, string> {
  if (identity === null || !isValidCommitIdentity(identity)) {
    return {}
  }
  const name = identity.name.trim()
  const email = identity.email.trim()
  return {
    GIT_AUTHOR_NAME: name,
    GIT_AUTHOR_EMAIL: email,
    GIT_COMMITTER_NAME: name,
    GIT_COMMITTER_EMAIL: email
  }
}
