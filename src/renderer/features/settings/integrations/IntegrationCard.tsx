import { Download, ExternalLink, LogIn, RefreshCw } from 'lucide-react'
import type { ReactNode } from 'react'
import type { IntegrationInfo, IntegrationState, IntegrationStatus } from '../../../../shared/integrations'
import { runInTerminal } from '../../../state/openTerminal'
import { useProjectsStore } from '../../../state/projectsStore'
import { toast } from '../../../state/toastStore'
import { Button } from '../../../ui/Button'
import { Chip } from '../../../ui/Chip'
import { Spinner } from '../../../ui/Spinner'
import { StatusDot, type StatusTone } from '../../../ui/StatusDot'
import { HostMark } from './HostMark'

interface IntegrationCardProps {
  info: IntegrationInfo
  status: IntegrationStatus | null
  canInstallWithWinget: boolean
  isChecking: boolean
  onRecheck: () => void
}

const STATE_CHIPS: Record<IntegrationState, { label: string; tone: StatusTone }> = {
  'not-installed': { label: 'Not installed', tone: 'warning' },
  'signed-out': { label: 'Not signed in', tone: 'warning' },
  expired: { label: 'Sign-in expired', tone: 'danger' },
  'signed-in': { label: 'Connected', tone: 'success' },
  unknown: { label: 'Could not check', tone: 'neutral' }
}

function runCommand(command: string, title: string): void {
  runInTerminal(useProjectsStore.getState().activeProjectPath, command, title)
}

function installedLine(info: IntegrationInfo, status: IntegrationStatus): string {
  return status.version === null ? `${info.command} is installed` : `${info.command} ${status.version} is installed`
}

function messageFor(info: IntegrationInfo, status: IntegrationStatus): ReactNode {
  const messages: Record<IntegrationState, ReactNode> = {
    'not-installed': `Install the ${info.cliName} so O-BROS and the agents in your terminals can use ${info.name}.`,
    'signed-out': `${installedLine(info, status)}, but not signed in. Sign in once in a terminal; ${info.command} keeps the sign-in.`,
    expired: `${installedLine(info, status)}, but its saved sign-in no longer works. Sign in again.`,
    'signed-in': (
      <span className="integration-accounts">
        {status.accounts.map((account) => (
          <span key={`${account.host} ${account.name}`} className="integration-account">
            <StatusDot tone="success" />
            <span>
              Signed in to {account.host} as <strong>{account.name}</strong>
            </span>
          </span>
        ))}
        <span className="muted">{installedLine(info, status)}.</span>
      </span>
    ),
    unknown: `${installedLine(info, status)}, but O-BROS could not check the sign-in. Check your connection, then press Re-check.`
  }
  return messages[status.state]
}

export function IntegrationCard({ info, status, canInstallWithWinget, isChecking, onRecheck }: IntegrationCardProps) {
  const chip = status === null ? null : STATE_CHIPS[status.state]

  function install(): void {
    runCommand(`winget install --id ${info.wingetId} --exact --source winget`, `Install ${info.cliName}`)
    toast.info(`Installing the ${info.cliName} in a terminal. When it finishes, come back here and press Re-check.`)
  }

  function openDownloadPage(): void {
    window.open(info.installUrl, '_blank', 'noopener')
  }

  function signIn(): void {
    runCommand(info.signInCommand, `${info.name} sign-in`)
    toast.info(`Finish signing in to ${info.name} in the terminal, then come back here.`)
  }

  return (
    <section className="integration-card" aria-label={info.name}>
      <header className="integration-header">
        <span className="integration-mark">
          <HostMark id={info.id} />
        </span>
        <span className="integration-heading">
          <span className="integration-name">{info.name}</span>
          <span className="muted">{info.description}</span>
        </span>
        {chip === null ? (
          <Chip icon={<Spinner size={12} />}>Checking…</Chip>
        ) : (
          <Chip tone={chip.tone}>{chip.label}</Chip>
        )}
      </header>
      {status !== null && (
        <div className="integration-body">
          <p className="integration-message">{messageFor(info, status)}</p>
          <div className="integration-actions">
            {status.state === 'not-installed' && canInstallWithWinget && (
              <Button variant="primary" onClick={install}>
                <Download size={14} /> Install with winget
              </Button>
            )}
            {status.state === 'not-installed' && (
              <Button variant={canInstallWithWinget ? 'outline' : 'primary'} onClick={openDownloadPage}>
                <ExternalLink size={14} /> Download page
              </Button>
            )}
            {status.state !== 'not-installed' && (
              <Button variant={status.state === 'signed-in' ? 'outline' : 'primary'} onClick={signIn}>
                <LogIn size={14} /> {status.state === 'signed-in' ? 'Add another account' : status.state === 'expired' ? 'Sign in again' : 'Sign in'}
              </Button>
            )}
            <Button variant="outline" disabled={isChecking} onClick={onRecheck}>
              {isChecking ? <Spinner size={14} /> : <RefreshCw size={14} />} Re-check
            </Button>
          </div>
        </div>
      )}
    </section>
  )
}
