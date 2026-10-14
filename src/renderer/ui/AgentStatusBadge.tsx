import { agentStatusOf, providerOfCommand, type AgentStatus } from '../../shared/agentLaunchers'
import { selectActiveAccount, useAccountsStore } from '../state/accountsStore'
import { useInstalledCommandsStore } from '../state/installedCommandsStore'

const LABELS: Record<AgentStatus, string> = {
  checking: 'Checking…',
  connected: 'Connected',
  'signed-in': 'Signed in',
  'signed-out': 'Not signed in',
  missing: 'Not found',
  'custom-path': 'Custom path'
}

const TITLES: Record<AgentStatus, string> = {
  checking: 'Looking for this command in your PATH',
  connected: 'This command was found in your PATH',
  'signed-in': 'Found in your PATH, and a login was detected for it',
  'signed-out': 'Found in your PATH, but no login was detected. Run it in a terminal to sign in.',
  missing: 'This command was not found in your PATH. Install it or check the spelling.',
  'custom-path': 'This command points to a file path, so o-bros cannot check it'
}

export function AgentStatusBadge({ command, showLabel = true }: { command: string; showLabel?: boolean }) {
  const installedCommands = useInstalledCommandsStore((state) => state.commands)
  const provider = providerOfCommand(command)
  const hasLogin = useAccountsStore((state) =>
    provider === null ? null : selectActiveAccount(state, provider) !== null
  )
  const status = agentStatusOf(command, installedCommands, hasLogin)

  return (
    <span className={`agent-status agent-status-${status}`} title={TITLES[status]}>
      <span className="agent-status-dot" />
      {showLabel && LABELS[status]}
    </span>
  )
}
