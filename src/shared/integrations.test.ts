import { describe, expect, it } from 'vitest'
import { accountsInAuthStatus, stateOfAuthStatus, versionInOutput } from './integrations'
import { expandWindowsVariables, mergeWindowsPath } from './windowsPath'

const GH_SIGNED_IN = `github.com
  ✓ Logged in to github.com account octocat (keyring)
  - Active account: true
  - Git operations protocol: https
  - Token: gho_************************************
  - Token scopes: 'gist', 'read:org', 'repo', 'workflow'

  ✓ Logged in to github.com account work-octo (keyring)
  - Active account: false
`

const GH_OLD_FORMAT = `github.com
  ✓ Logged in to github.com as octocat (oauth_token)
  ✓ Git operations for github.com configured to use https protocol.
  ✓ Token: *******************
`

const GH_EXPIRED = `github.com
  X Failed to log in to github.com account octocat (keyring)
  - Active account: true
  - The token in keyring is invalid.
  - To re-authenticate, run: gh auth login -h github.com
`

const GLAB_SIGNED_IN = `gitlab.com
  ✓ Logged in to gitlab.com as tanuki (C:\\Users\\me\\AppData\\Local\\glab-cli\\config.yml)
  ✓ Git operations for gitlab.com configured to use https protocol.
  ✓ API calls for gitlab.com are made over https protocol.
  ✓ Token found: **************************
`

describe('accountsInAuthStatus', () => {
  it('reads every signed-in account, in the new and old gh formats and in glab', () => {
    expect(accountsInAuthStatus(GH_SIGNED_IN)).toEqual([
      { host: 'github.com', name: 'octocat' },
      { host: 'github.com', name: 'work-octo' }
    ])
    expect(accountsInAuthStatus(GH_OLD_FORMAT)).toEqual([{ host: 'github.com', name: 'octocat' }])
    expect(accountsInAuthStatus(GLAB_SIGNED_IN)).toEqual([{ host: 'gitlab.com', name: 'tanuki' }])
  })

  it('never keeps anything from the token lines', () => {
    const everything = JSON.stringify(accountsInAuthStatus(GH_SIGNED_IN + GH_OLD_FORMAT + GLAB_SIGNED_IN))
    expect(everything).not.toContain('gho_')
    expect(everything).not.toContain('*')
    expect(everything).not.toContain('Token')
  })

  it('does not count an account whose sign-in failed', () => {
    expect(accountsInAuthStatus(GH_EXPIRED)).toEqual([])
  })
})

describe('stateOfAuthStatus', () => {
  it('tells signed in, expired, signed out and unknown apart', () => {
    expect(stateOfAuthStatus(GH_SIGNED_IN, accountsInAuthStatus(GH_SIGNED_IN))).toBe('signed-in')
    expect(stateOfAuthStatus(GH_EXPIRED, [])).toBe('expired')
    expect(stateOfAuthStatus('You are not logged into any GitHub hosts. To log in, run: gh auth login\n', [])).toBe('signed-out')
    expect(stateOfAuthStatus('x gitlab.com has not been authenticated with glab. Run glab auth login gitlab.com\n', [])).toBe('signed-out')
    expect(stateOfAuthStatus('No token found (checked config file, keyring, and environment variables).\n', [])).toBe('signed-out')
    expect(stateOfAuthStatus('error connecting to api.github.com\n', [])).toBe('unknown')
  })
})

describe('versionInOutput', () => {
  it('reads the version from gh and glab', () => {
    expect(versionInOutput('gh version 2.63.2 (2024-12-05)\nhttps://github.com/cli/cli/releases/tag/v2.63.2\n')).toBe('2.63.2')
    expect(versionInOutput('glab 1.48.0 (a1b2c3d)\n')).toBe('1.48.0')
    expect(versionInOutput('glab version v1.36.0 (2024-01-01)')).toBe('1.36.0')
    expect(versionInOutput('nothing here')).toBeNull()
  })
})

describe('windowsPath', () => {
  const environment = { USERPROFILE: 'C:\\Users\\me', SystemRoot: 'C:\\WINDOWS' }

  it('expands %VARIABLES% in any case and keeps unknown ones', () => {
    expect(expandWindowsVariables('%userprofile%\\bin;%SystemRoot%\\system32', environment)).toBe('C:\\Users\\me\\bin;C:\\WINDOWS\\system32')
    expect(expandWindowsVariables('%NOPE%\\x;100%', environment)).toBe('%NOPE%\\x;100%')
    expect(expandWindowsVariables('plain', environment)).toBe('plain')
  })

  it('adds only folders that are missing, keeping the current order first', () => {
    expect(mergeWindowsPath('C:\\a;C:\\B\\', ['c:\\b;C:\\Program Files\\GitHub CLI\\', 'C:\\a;;D:\\tools'])).toBe(
      'C:\\a;C:\\B\\;C:\\Program Files\\GitHub CLI\\;D:\\tools'
    )
  })
})
