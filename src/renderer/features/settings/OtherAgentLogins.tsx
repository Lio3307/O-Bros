import { useEffect, useState } from 'react'
import type { AgentLogin, AgentLoginKind } from '../../../shared/agentLogins'
import { useRefreshStore } from '../../state/refreshStore'
import { AgentName } from '../../ui/AgentName'
import { Chip } from '../../ui/Chip'
import { LoadingText } from '../../ui/LoadingText'
import { SettingsSection } from '../../ui/SettingsSection'
import { StatusDot, type StatusTone } from '../../ui/StatusDot'

const TONE_BY_KIND: Record<AgentLoginKind, StatusTone> = { account: 'success', 'api-keys': 'info', none: 'danger', unknown: 'neutral' }
const KIND_LABELS: Record<AgentLoginKind, string> = {
  account: 'Signed in',
  'api-keys': 'API key',
  none: 'Not signed in',
  unknown: 'Not checked'
}

function needsAction(login: AgentLogin): boolean {
  return login.kind === 'none' || login.kind === 'unknown'
}

function AgentLoginRow({ login }: { login: AgentLogin }) {
  return (
    <div className="table-row agent-login-row">
      <div className="cell cell-account">
        <span className="agent-login-title">
          <AgentName command={login.command} label={login.title} size={16} isStrong />
          <span className="status-label">
            <StatusDot tone={TONE_BY_KIND[login.kind]} />
            {KIND_LABELS[login.kind]}
          </span>
        </span>
        <span>{login.summary}</span>
        {login.requirement !== undefined && <span className="muted">{login.requirement}</span>}
        {login.providers.length > 0 && (
          <span className="agent-login-providers">
            {login.providers.map((provider) => (
              <Chip key={provider}>{provider}</Chip>
            ))}
          </span>
        )}
        <span className={needsAction(login) ? 'agent-login-action' : 'muted'}>
          {needsAction(login) ? 'To sign in: ' : 'To change it: '}
          {login.manageHint}
        </span>
      </div>
    </div>
  )
}

export function OtherAgentLogins() {
  const [logins, setLogins] = useState<AgentLogin[] | null>(null)
  const lastRefreshedAt = useRefreshStore((state) => state.lastRefreshedAt)

  useEffect(() => {
    let isCurrent = true
    window.api.accounts
      .agentLogins()
      .then((found) => isCurrent && setLogins(found))
      .catch(() => isCurrent && setLogins([]))
    return () => {
      isCurrent = false
    }
  }, [lastRefreshedAt])

  if (logins !== null && logins.length === 0) {
    return null
  }

  return (
    <SettingsSection
      title="Other agents"
      description={
        <>
          The other agent CLIs installed on this computer and how each one signs in. o-bros reads only the account name,
          the login type and the provider names from their files, and only whether an API key variable is set, never a key or token itself, and never changes them. API key variables are read when O-BROS starts, so restart it after you set one. Each
          agent keeps one login, so switching accounts here is only possible for Claude and Codex.
        </>
      }
    >
      {logins === null ? (
        <p className="muted">
          <LoadingText text="Looking for other agents' logins…" />
        </p>
      ) : (
        <div className="table">
          {logins.map((login) => (
            <AgentLoginRow key={login.command} login={login} />
          ))}
        </div>
      )}
    </SettingsSection>
  )
}
