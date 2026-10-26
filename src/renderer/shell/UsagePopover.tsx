import { ChevronRight } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { formatResetsIn } from '../../shared/time'
import type { PlanUsage } from '../../shared/planUsage'
import type { ProviderId } from '../../shared/types'
import { selectActiveAccount, useAccountsStore } from '../state/accountsStore'
import { useLayoutStore, type Section } from '../state/layoutStore'
import { useUsageStore } from '../state/usageStore'
import { useUsageVisibilityStore } from '../state/usageVisibilityStore'
import { ProviderMark } from '../ui/ProviderMark'
import { AgentIcon } from '../ui/AgentIcon'
import { AccountsRefreshButton } from '../ui/AccountsRefreshButton'
import { UsageBar } from '../ui/UsageBar'
import { isUsageHigh, listUsageWindows, nearestReset, type LabeledWindow } from '../ui/usageText'
import { cn } from '../ui/cn'
import { useNow } from '../ui/useNow'
import './usagePopover.css'
import { SegmentedControl } from '../ui/SegmentedControl'

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

interface UsageRowProps {
  mark: ReactNode
  name: string
  windows: LabeledWindow[]
  errorMessage: string | null
  note: ReactNode
  mode: UsageViewMode
  onOpen?: () => void
}

function UsageRow({ mark, name, windows, errorMessage, note, mode, onOpen }: UsageRowProps) {
  const now = useNow(USAGE_TEXT_REFRESH_MS)
  const reset = nearestReset(windows)
  const content = (
    <>
      <span className="usage-provider-mark">{mark}</span>
      <span className="usage-provider-body">
        <span className="usage-provider-heading">
          <span className="usage-provider-name">{name}</span>
          <span className="muted">
            {reset === null ? 'Usage unavailable' : `Resets in ${formatResetsIn(reset.resetsAt, now)}`}
          </span>
        </span>
        {mode === 'detailed' && (
          <span className="usage-provider-windows">
            {windows.map(({ label, window }) => (
              <span key={label} className={cn('usage-window', isUsageHigh(window.percentUsed) && 'usage-high')}>
                <span className="muted">{label}</span>
                <UsageBar percentUsed={window.percentUsed} tone={isUsageHigh(window.percentUsed) ? 'danger' : 'normal'} />
                <span className="usage-window-percent">{window.percentUsed}%</span>
              </span>
            ))}
          </span>
        )}
        {windows.length === 0 && errorMessage && <span className="muted">{errorMessage}</span>}
        {note}
        {mode === 'compact' && windows.length > 0 && (
          <span className="muted">
            {windows.map(({ label, window }) => `${label} ${window.percentUsed}%`).join(' · ')}
          </span>
        )}
      </span>
      {onOpen !== undefined && <ChevronRight size={16} className="muted" />}
    </>
  )
  if (onOpen === undefined) {
    return <div className="usage-provider">{content}</div>
  }
  return (
    <button type="button" className="usage-provider" onClick={onOpen}>
      {content}
    </button>
  )
}

function ProviderUsageRow({ provider, mode, onOpen }: { provider: ProviderId; mode: UsageViewMode; onOpen: () => void }) {
  const account = useAccountsStore((state) => selectActiveAccount(state, provider))
  const usage = useUsageStore((state) => (account === null ? undefined : state.usageByAccountId[account.id]))

  if (account === null) {
    return null
  }

  const staleNote =
    usage?.isStale === true && usage.measuredAt !== null ? (
      <span className="muted">
        Last known numbers from {new Date(usage.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}. The latest
        check failed: {usage.errorMessage}
      </span>
    ) : null

  return (
    <UsageRow
      mark={<ProviderMark provider={provider} size={18} />}
      name={providerNames[provider]}
      windows={listUsageWindows(usage)}
      errorMessage={usage?.errorMessage ?? null}
      note={staleNote}
      mode={mode}
      onOpen={onOpen}
    />
  )
}

function planTitle(plan: PlanUsage): string {
  return plan.plan === null || plan.plan === plan.name ? plan.name : `${plan.name} · ${plan.plan}`
}

function PlanUsageRow({ plan, mode }: { plan: PlanUsage; mode: UsageViewMode }) {
  return (
    <UsageRow
      mark={<AgentIcon command={plan.logoCommand} size={18} />}
      name={planTitle(plan)}
      windows={plan.windows}
      errorMessage={plan.errorMessage}
      note={null}
      mode={mode}
    />
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

const USAGE_MODE_OPTIONS = [
  { value: 'detailed' as const, label: 'Detailed' },
  { value: 'compact' as const, label: 'Compact' }
]

export function UsagePopover({ onNavigate }: UsagePopoverProps) {
  const [mode, setMode] = useState<UsageViewMode>('detailed')
  const allPlans = useUsageStore((state) => state.plans)
  const hiddenSources = useUsageVisibilityStore((state) => state.hiddenSources)
  const providers = providerOrder.filter((provider) => !hiddenSources.includes(provider))
  const plans = allPlans.filter((plan) => !hiddenSources.includes(plan.id))
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
      <SegmentedControl
        className="usage-popover-modes"
        options={USAGE_MODE_OPTIONS}
        value={mode}
        onChange={setMode}
      />
      <div className="usage-providers">
        {providers.map((provider) => (
          <ProviderUsageRow key={provider} provider={provider} mode={mode} onOpen={goToAccounts} />
        ))}
        {plans.map((plan) => (
          <PlanUsageRow key={plan.id} plan={plan} mode={mode} />
        ))}
      </div>
      <NavigationRow label="Usage details & history" onClick={() => goToSection('history')} />
      <NavigationRow label="Manage accounts…" onClick={goToAccounts} />
    </div>
  )
}
