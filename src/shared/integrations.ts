export type IntegrationId = 'github' | 'gitlab'

export type IntegrationState = 'not-installed' | 'signed-out' | 'signed-in' | 'expired' | 'unknown'

export interface IntegrationInfo {
  id: IntegrationId
  name: string
  command: string
  cliName: string
  description: string
  installUrl: string
  wingetId: string
  signInCommand: string
}

export interface IntegrationAccount {
  host: string
  name: string
}

export interface IntegrationStatus {
  id: IntegrationId
  state: IntegrationState
  version: string | null
  accounts: IntegrationAccount[]
}

export interface IntegrationsReport {
  statuses: IntegrationStatus[]
  canInstallWithWinget: boolean
}

export const INTEGRATIONS: IntegrationInfo[] = [
  {
    id: 'github',
    name: 'GitHub',
    command: 'gh',
    cliName: 'GitHub CLI',
    description: 'Pull requests, issues and checks through the GitHub CLI (gh).',
    installUrl: 'https://cli.github.com',
    wingetId: 'GitHub.cli',
    signInCommand: 'gh auth login'
  },
  {
    id: 'gitlab',
    name: 'GitLab',
    command: 'glab',
    cliName: 'GitLab CLI',
    description: 'Merge requests, issues and pipelines through the GitLab CLI (glab).',
    installUrl: 'https://gitlab.com/gitlab-org/cli#installation',
    wingetId: 'GLab.GLab',
    signInCommand: 'glab auth login'
  }
]

const LOGGED_IN = 'logged in to '
const NAME_MARKERS = [' account ', ' as ']
const EXPIRED_MARKERS = ['failed to log in', 'token in keyring is invalid', 'token is invalid']
const SIGNED_OUT_MARKERS = ['not logged into', 'not logged in', 'has not been authenticated', 'no token found', 'not authenticated']

function firstWord(text: string): string {
  return text.trim().split(' ')[0] ?? ''
}

function accountOf(line: string): IntegrationAccount | null {
  const lowerLine = line.toLowerCase()
  const start = lowerLine.indexOf(LOGGED_IN)
  if (start === -1 || lowerLine.includes('failed to log in')) {
    return null
  }
  const afterHost = line.slice(start + LOGGED_IN.length)
  const host = firstWord(afterHost)
  const rest = afterHost.slice(afterHost.indexOf(host) + host.length)
  const marker = NAME_MARKERS.find((candidate) => rest.startsWith(candidate))
  const name = marker === undefined ? '' : firstWord(rest.slice(marker.length))
  return host === '' || name === '' ? null : { host, name }
}

export function accountsInAuthStatus(output: string): IntegrationAccount[] {
  const accounts: IntegrationAccount[] = []
  for (const line of output.split('\n')) {
    const account = accountOf(line.trim())
    if (account !== null && !accounts.some((known) => known.host === account.host && known.name === account.name)) {
      accounts.push(account)
    }
  }
  return accounts
}

export function stateOfAuthStatus(output: string, accounts: IntegrationAccount[]): IntegrationState {
  const lowerOutput = output.toLowerCase()
  if (accounts.length > 0) {
    return 'signed-in'
  }
  if (EXPIRED_MARKERS.some((marker) => lowerOutput.includes(marker))) {
    return 'expired'
  }
  return SIGNED_OUT_MARKERS.some((marker) => lowerOutput.includes(marker)) ? 'signed-out' : 'unknown'
}

function startsWithDigit(word: string): boolean {
  const first = word.charAt(0)
  return first >= '0' && first <= '9'
}

export function versionInOutput(output: string): string | null {
  const firstLine = output.trim().split('\n')[0] ?? ''
  const word = firstLine
    .split(' ')
    .map((candidate) => (candidate.startsWith('v') ? candidate.slice(1) : candidate))
    .find(startsWithDigit)
  return word === undefined ? null : word.trim()
}
