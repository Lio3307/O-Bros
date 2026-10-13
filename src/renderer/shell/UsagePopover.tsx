import { ChevronRight } from 'lucide-react'
import { useState } from 'react'
import { formatResetsIn } from '../../shared/time'
import type { ProviderId } from '../../shared/types'
import { selectActiveAccount, useAccountsStore } from '../state/accountsStore'
import { useLayoutStore, type Section } from '../state/layoutStore'
import { useUsageStore } from '../state/usageStore'
import { ProviderMark } from '../ui/ProviderMark'
import { AccountsRefreshButton } from '../ui/AccountsRefreshButton'
import { UsageBar } from '../ui/UsageBar'
import { listUsageWindows, nearestReset } from '../ui/usageText'
import { useNow } from '../ui/useNow'
import './usagePopover.css'

type UsageViewMode = 'detailed' | 'compact'

interface UsagePopoverProps {
  onNavigate: () => void
}

const USAGE_TEXT_REFRESH_MS = 30_000

const providerNames: Record<ProviderId, string> = {
  claude: 'Claude',
  codex: 'Codex'
}

const providerOrder: ProviderId[] = ['claude', 'codex']

function ProviderUsageRow({ provider, mode, onOpen }: { provider: ProviderId; mode: UsageViewMode; onOpen: () => void }) {
  const account = useAccountsStore((state) => selectActiveAccount(state, provider))
  const usage = useUsageStore((state) => (account === null ? undefined : state.usageByAccountId[account.id]))
  const now = useNow(USAGE_TEXT_REFRESH_MS)

  if (account === null) {
    return null
  }

  const windows = listUsageWindows(usage)
  const reset = nearestReset(windows)

  return (
    <button type="button" className="usage-provider" onClick={onOpen}>
      <span className="usage-provider-mark">
        <ProviderMark provider={provider} size={18} />
      </span>
      <span className="usage-provider-body">
        <span className="usage-provider-heading">
          <span className="usage-provider-name">{providerNames[provider]}</span>
          <span className="muted">
            {reset === null ? 'Usage unavailable' : `Resets in ${formatResetsIn(reset.resetsAt, now)}`}
          </span>
        </span>
        {mode === 'detailed' && (
          <span className="usage-provider-windows">
            {windows.map(({ label, window }) => (
              <span key={label} className="usage-window">
                <span className="muted">{label}</span>
                <UsageBar percentUsed={window.percentUsed} />
                <span className="usage-window-percent">{window.percentUsed}%</span>
              </span>
            ))}
          </span>
        )}
        {windows.length === 0 && usage?.errorMessage && <span className="muted">{usage.errorMessage}</span>}
        {mode === 'compact' && windows.length > 0 && (
          <span className="muted">
            {windows.map(({ label, window }) => `${label} ${window.percentUsed}%`).join(' · ')}
          </span>
        )}
      </span>
      <ChevronRight size={16} className="muted" />
    </button>
  )
}

function NavigationRow({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button type="button" className="usage-navigation-row" onClick={onClick}>
      <span>{label}</span>
      <ChevronRight size={16} className="muted" />
    </button>
  )
}

export function UsagePopover({ onNavigate }: UsagePopoverProps) {
  const [mode, setMode] = useState<UsageViewMode>('detailed')
  const openSection = useLayoutStore((state) => state.openSection)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  function goToSection(section: Section): void {
    openSection(section)
    onNavigate()
  }

  function goToAccounts(): void {
    selectSettingsPage('accounts')
    goToSection('settings')
  }

  return (
    <div className="usage-popover" role="dialog" aria-label="Usage">
      <header className="usage-popover-header">
        <span className="usage-popover-title">Usage</span>
        <span className="usage-popover-tools">
          <span className="muted">all agents</span>
          <AccountsRefreshButton variant="icon" />
        </span>
      </header>
      <div className="segmented usage-popover-modes">
        <button
          type="button"
          className={mode === 'detailed' ? 'segment segment-active' : 'segment'}
          onClick={() => setMode('detailed')}
        >
          Detailed
        </button>
        <button
          type="button"
          className={mode === 'compact' ? 'segment segment-active' : 'segment'}
          onClick={() => setMode('compact')}
        >
          Compact
        </button>
      </div>
      <div className="usage-providers">
        {providerOrder.map((provider) => (
          <ProviderUsageRow key={provider} provider={provider} mode={mode} onOpen={goToAccounts} />
        ))}
      </div>
      <NavigationRow label="Usage details & history" onClick={() => goToSection('history')} />
      <NavigationRow label="Manage accounts…" onClick={goToAccounts} />
    </div>
  )
}
