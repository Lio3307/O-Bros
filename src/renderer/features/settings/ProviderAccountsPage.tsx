import { Plus } from 'lucide-react'
import { useState } from 'react'
import { accountFolderSuffix } from '../../../shared/accountFolderName'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { formatAge, formatResetsIn } from '../../../shared/time'
import type { DetectedAccount, ProviderId, UsageWindow } from '../../../shared/types'
import { selectActiveAccount, useAccountsStore } from '../../state/accountsStore'
import { useIsProviderPresent } from '../../state/presentProviders'
import { openAccountSignInTerminal } from '../../state/openTerminal'
import { useRefreshStore } from '../../state/refreshStore'
import { toast } from '../../state/toastStore'
import { useUsageStore } from '../../state/usageStore'
import { AccountsRefreshButton } from '../../ui/AccountsRefreshButton'
import { ProviderMark } from '../../ui/ProviderMark'
import { UsageBar } from '../../ui/UsageBar'
import { useNow } from '../../ui/useNow'
import './settings.css'
import './settingsControls.css'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { OtherAgentLogins } from './OtherAgentLogins'
import { CustomProviders } from './providers/CustomProviders'

const USAGE_TEXT_REFRESH_MS = 30_000
const SYSTEM_DEFAULT_TITLE = 'System default'

interface ProviderSection {
  provider: ProviderId
  title: string
  description: string
  signInCommand: string
}

const providerSections: ProviderSection[] = [
  {
    provider: 'claude',
    title: 'Claude',
    description: 'Optional. o-bros uses your normal Claude login. Add accounts only to switch between them quickly.',
    signInCommand: 'claude auth login'
  },
  {
    provider: 'codex',
    title: 'Codex',
    description: 'Optional. o-bros uses your normal Codex login. Add accounts only to switch between them quickly.',
    signInCommand: 'codex login'
  }
]

function UsageCell({ label, window, now }: { label: string; window: UsageWindow | null; now: number }) {
  return (
    <div className="account-usage">
      <span className="account-usage-label">{label}</span>
      {window === null ? (
        <span className="muted">—</span>
      ) : (
        <span className="usage-cell">
          <UsageBar percentUsed={window.percentUsed} />
          <span className="muted">
            {window.percentUsed}% · {formatResetsIn(window.resetsAt, now)}
          </span>
        </span>
      )}
    </div>
  )
}

function accountSubtitle(account: DetectedAccount): string {
  if (!account.isSystemDefault) {
    return account.configDir
  }
  return account.label === SYSTEM_DEFAULT_TITLE ? 'Your current login on this computer.' : account.label
}

function AccountCard({ account, isActive, now }: { account: DetectedAccount; isActive: boolean; now: number }) {
  const usage = useUsageStore((state) => state.usageByAccountId[account.id])
  const selectAccount = useAccountsStore((state) => state.selectAccount)

  return (
    <div className="account-card">
      <div className="account-card-main">
        <div className="account-card-title">
          <span className="account-label">{account.isSystemDefault ? SYSTEM_DEFAULT_TITLE : account.label}</span>
          {isActive && <span className="chip chip-current">Active</span>}
        </div>
        <span className="muted account-card-subtitle">{accountSubtitle(account)}</span>
      </div>
      <UsageCell label="5 hours" window={usage?.fiveHour ?? null} now={now} />
      <UsageCell label="Weekly" window={usage?.weekly ?? null} now={now} />
      {!isActive && (
        <Button variant="outline" onClick={() => selectAccount(account.provider, account.id)}>
          Use
        </Button>
      )}
    </div>
  )
}

function ProviderBlock({ section }: { section: ProviderSection }) {
  const allAccounts = useAccountsStore((state) => state.accounts)
  const activeAccount = useAccountsStore((state) => selectActiveAccount(state, section.provider))
  const now = useNow(USAGE_TEXT_REFRESH_MS)
  const [isNaming, setIsNaming] = useState(false)
  const [accountName, setAccountName] = useState('')
  const accounts = allAccounts.filter((account) => account.provider === section.provider)
  const hasExtraAccounts = accounts.some((account) => !account.isSystemDefault)
  const canCreate = accountFolderSuffix(accountName) !== ''

  function cancelNaming(): void {
    setIsNaming(false)
    setAccountName('')
  }

  async function addAccount(): Promise<void> {
    if (!canCreate) {
      return
    }
    try {
      await openAccountSignInTerminal(section.provider, accountName, section.signInCommand)
      toast.success('A terminal opened for ' + accountName.trim() + '. Finish signing in there, then press Rescan.')
      cancelNaming()
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not add the account. Please try again.'))
    }
  }

  return (
    <section className="provider-block">
      <header className="provider-header">
        <span className="provider-title">
          <ProviderMark provider={section.provider} /> {section.title}
        </span>
        <p className="muted">{section.description}</p>
      </header>

      <div className="accounts-heading">
        <div>
          <h2 className="settings-subtitle">Accounts</h2>
          <p className="muted">Found on this computer. New accounts are added here too.</p>
        </div>
        <Button variant="outline" onClick={() => setIsNaming(true)}>
          <Plus size={14} /> Add account
        </Button>
      </div>
      {isNaming && (
        <div className="add-account-form">
          <p className="add-account-steps">
            1. Give the account a short name, for example <span className="mono">work</span> or{' '}
            <span className="mono">personal</span>.
            <br />
            2. A terminal opens and {section.title} shows a sign-in link. Open it in your browser and approve.
            <br />
            3. Come back here and press Rescan. The account appears in the list.
          </p>
          <div className="add-account-row">
            <input
              className="field"
              placeholder="Account name"
              autoFocus
              value={accountName}
              onChange={(event) => setAccountName(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  void addAccount()
                } else if (event.key === 'Escape') {
                  cancelNaming()
                }
              }}
            />
            <Button variant="primary" disabled={!canCreate} onClick={() => addAccount()}>
              Create and sign in
            </Button>
            <Button variant="outline" onClick={cancelNaming}>
              Cancel
            </Button>
          </div>
        </div>
      )}

      <div className="account-list">
        {accounts.length === 0 && (
          <p className="account-note">No {section.title} login found on this computer yet. Add an account to sign in.</p>
        )}
        {accounts.map((account) => (
          <AccountCard key={account.id} account={account} isActive={account.id === activeAccount?.id} now={now} />
        ))}
        {accounts.length > 0 && !hasExtraAccounts && (
          <p className="account-note">
            No extra {section.title} accounts. o-bros uses your system default login until you add one here.
          </p>
        )}
      </div>
    </section>
  )
}

function useVisibleProviderSections(): ProviderSection[] {
  const isProviderPresent = useIsProviderPresent()
  return providerSections.filter((section) => isProviderPresent(section.provider))
}

function LastUpdatedText() {
  const lastRefreshedAt = useRefreshStore((state) => state.lastRefreshedAt)
  const now = useNow(USAGE_TEXT_REFRESH_MS)

  if (lastRefreshedAt === null) {
    return null
  }
  return <span className="muted">Updated {formatAge(lastRefreshedAt, now)}</span>
}

export function ProviderAccountsPage() {
  const sections = useVisibleProviderSections()

  return (
    <SettingsPageLayout
      title="Provider accounts"
      description={
        <>
          o-bros reads the logins of the agent CLIs installed on this computer and never stores or shows credentials.
          Claude and Codex can have several accounts: adding one creates an empty folder in your home directory and opens
          a terminal where the official CLI signs you in. The other agents are listed with the login they use.
        </>
      }
      actions={
        <>
          <LastUpdatedText />
          <AccountsRefreshButton variant="labeled" label="Rescan" />
        </>
      }
    >
      {sections.map((section) => (
        <ProviderBlock key={section.provider} section={section} />
      ))}
      <OtherAgentLogins />
      <CustomProviders />
    </SettingsPageLayout>
  )
}
