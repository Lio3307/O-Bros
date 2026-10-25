import { CircleAlert, MemoryStick, Terminal, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { describeCredit, formatDollars, type CreditBalance } from '../../shared/creditBalance'
import { formatBytes } from '../../shared/format'
import type { ProviderId } from '../../shared/types'
import type { KnownUsage } from '../../shared/usageMerge'
import { ProblemsPopover } from '../features/problems/ProblemsPopover'
import { ResourcePopover } from '../features/resources/ResourcePopover'
import { selectActiveAccount, useAccountsStore } from '../state/accountsStore'
import { countProblems, useProblemsStore } from '../state/problemsStore'
import { useResourcesStore } from '../state/resourcesStore'
import { useUsageStore } from '../state/usageStore'
import { useUsageVisibilityStore } from '../state/usageVisibilityStore'
import { AccountsRefreshButton } from '../ui/AccountsRefreshButton'
import { AgentIcon } from '../ui/AgentIcon'
import { ProviderMark } from '../ui/ProviderMark'
import { describeCompactWindow, isUsageHigh, listUsageWindows, mostPressingWindow, type LabeledWindow } from '../ui/usageText'
import { cn } from '../ui/cn'
import { useNow } from '../ui/useNow'
import { UsagePopover } from './UsagePopover'

type OpenPanel = 'usage' | 'resources' | 'problems' | null

const USAGE_TEXT_REFRESH_MS = 30_000
const RESOURCE_POLL_IDLE_MS = 60_000
const RESOURCE_POLL_OPEN_MS = 3_000
const APP_MEMORY_POLL_MS = 5_000

const PROVIDERS: ProviderId[] = ['claude', 'codex']

const PROVIDER_NAMES: Record<ProviderId, string> = { claude: 'Claude', codex: 'Codex' }

interface TrackedProvider {
  key: ProviderId
  windows: LabeledWindow[]
  usage: KnownUsage | undefined
}

function measuredText(usage: KnownUsage | undefined): string {
  if (usage === undefined || !usage.isStale || usage.measuredAt === null) {
    return ''
  }
  return ` (last known, ${new Date(usage.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
}

function describeProvider(entry: TrackedProvider): string {
  if (entry.windows.length === 0) {
    return `${PROVIDER_NAMES[entry.key]}: ${entry.usage?.errorMessage ? 'unavailable' : 'not read yet'}`
  }
  const parts = entry.windows.map(({ label, window }) => `${label} ${window.percentUsed}%`)
  return `${PROVIDER_NAMES[entry.key]}: ${parts.join(', ')}${measuredText(entry.usage)}`
}

function describeCreditLine(balance: CreditBalance): string {
  return `${balance.name} (via ${balance.viaTool}): ${describeCredit(balance)}`
}

function useTrackedProviders(): TrackedProvider[] {
  const accountsState = useAccountsStore()
  const usageByAccountId = useUsageStore((state) => state.usageByAccountId)
  const hiddenSources = useUsageVisibilityStore((state) => state.hiddenSources)
  return PROVIDERS.filter((provider) => !hiddenSources.includes(provider)).flatMap((provider) => {
    const account = selectActiveAccount(accountsState, provider)
    if (account === null) {
      return []
    }
    const usage = usageByAccountId[account.id]
    return [{ key: provider, windows: listUsageWindows(usage), usage }]
  })
}

function UsageSummary({ onClick }: { onClick: () => void }) {
  const tracked = useTrackedProviders()
  const allCredits = useUsageStore((state) => state.credits)
  const hiddenSources = useUsageVisibilityStore((state) => state.hiddenSources)
  const credits = allCredits.filter((balance) => !hiddenSources.includes(balance.id))
  const now = useNow(USAGE_TEXT_REFRESH_MS)
  if (tracked.length === 0 && credits.length === 0) {
    return null
  }

  const pressing = mostPressingWindow(tracked)
  const leadProvider = pressing?.key ?? tracked[0]?.key ?? null
  const otherProviders = tracked.map((entry) => entry.key).filter((provider) => provider !== leadProvider)
  const tooltipLines = [...tracked.map(describeProvider), ...credits.map(describeCreditLine)]
  const hasError = tracked.some((entry) => entry.windows.length === 0 && entry.usage?.errorMessage)
  const compact = pressing === null ? null : describeCompactWindow(pressing.window, now)
  const leadCredit = leadProvider === null ? credits[0] : null

  return (
    <>
      <button
        type="button"
        className="status-usage"
        title={[...tooltipLines, 'Click for details'].join('\n')}
        onClick={onClick}
      >
        {leadProvider !== null && <ProviderMark provider={leadProvider} size={16} />}
        {leadCredit !== null && leadCredit !== undefined && (
          <>
            <AgentIcon command={leadCredit.logoCommand} size={16} />
            <span className="status-percent">{leadCredit.errorMessage === null ? formatDollars(leadCredit.spentDollars) : 'unavailable'}</span>
          </>
        )}
        {leadProvider !== null && pressing === null && <span>{hasError ? 'unavailable' : '—'}</span>}
        {pressing !== null && compact !== null && (
          <span className={cn('status-window', isUsageHigh(pressing.window.percentUsed) && 'usage-high')}>
            <span className="status-window-label">{pressing.label}</span>
            <span className="status-percent">{compact.percent}</span>
            <span className="status-window-reset">{compact.remaining}</span>
          </span>
        )}
        {(otherProviders.length > 0 || (leadProvider !== null && credits.length > 0)) && (
          <span className="status-other-marks">
            {otherProviders.map((provider) => (
              <ProviderMark key={provider} provider={provider} size={12} />
            ))}
            {leadProvider !== null &&
              credits.map((balance) => <AgentIcon key={balance.id} command={balance.logoCommand} size={12} />)}
          </span>
        )}
      </button>
      <AccountsRefreshButton variant="icon" iconSize={12} />
    </>
  )
}

function ResourceStatus({ onClick }: { onClick: () => void }) {
  const snapshot = useResourcesStore((state) => state.snapshot)
  const memoryText = snapshot === null ? '—' : formatBytes(snapshot.total.privateBytes)
  const terminalCount = snapshot === null ? 0 : snapshot.terminals.length

  return (
    <button type="button" className="status-usage status-resources" title="Memory used by O-BROS and its terminals, like Task Manager shows it. Click for details." onClick={onClick}>
      <MemoryStick size={14} />
      <span className="status-percent">{memoryText}</span>
      <span className="status-separator">·</span>
      <Terminal size={14} />
      <span className="status-percent">{terminalCount}</span>
    </button>
  )
}

function ProblemsStatus({ onClick }: { onClick: () => void }) {
  const byFile = useProblemsStore((state) => state.byFile)
  const { errors, warnings } = countProblems(byFile)

  return (
    <button type="button" className="status-usage" title="Problems in open files" onClick={onClick}>
      <CircleAlert size={14} />
      <span className="status-percent">{errors}</span>
      <TriangleAlert size={14} />
      <span className="status-percent">{warnings}</span>
    </button>
  )
}

function useResourcePolling(isPanelOpen: boolean): void {
  const poll = useResourcesStore((state) => state.poll)
  const pollApp = useResourcesStore((state) => state.pollApp)

  useEffect(() => {
    function pollWhenShown(): void {
      if (!document.hidden) {
        void poll()
      }
    }
    function pollAppWhenShown(): void {
      if (!document.hidden) {
        void pollApp()
      }
    }
    pollWhenShown()
    const interval = isPanelOpen ? RESOURCE_POLL_OPEN_MS : RESOURCE_POLL_IDLE_MS
    const timer = setInterval(pollWhenShown, interval)
    const appTimer = setInterval(pollAppWhenShown, APP_MEMORY_POLL_MS)
    document.addEventListener('visibilitychange', pollWhenShown)
    return () => {
      clearInterval(timer)
      clearInterval(appTimer)
      document.removeEventListener('visibilitychange', pollWhenShown)
    }
  }, [poll, pollApp, isPanelOpen])
}

function useCloseOnOutsideClickOrEscape(isOpen: boolean, close: () => void) {
  const containerRef = useRef<HTMLElement>(null)

  useEffect(() => {
    if (!isOpen) {
      return
    }
    function closeWhenOutside(event: MouseEvent): void {
      if (!containerRef.current?.contains(event.target as Node)) {
        close()
      }
    }
    function closeOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape') {
        close()
      }
    }
    document.addEventListener('mousedown', closeWhenOutside)
    document.addEventListener('keydown', closeOnEscape)
    return () => {
      document.removeEventListener('mousedown', closeWhenOutside)
      document.removeEventListener('keydown', closeOnEscape)
    }
  }, [isOpen, close])

  return containerRef
}

export function StatusBar() {
  const [openPanel, setOpenPanel] = useState<OpenPanel>(null)
  const containerRef = useCloseOnOutsideClickOrEscape(openPanel !== null, () => setOpenPanel(null))
  useResourcePolling(openPanel === 'resources')

  function toggle(panel: Exclude<OpenPanel, null>): void {
    setOpenPanel(openPanel === panel ? null : panel)
  }

  return (
    <footer className="status-bar" ref={containerRef}>
      {openPanel === 'usage' && <UsagePopover onNavigate={() => setOpenPanel(null)} />}
      {openPanel === 'resources' && <ResourcePopover />}
      {openPanel === 'problems' && <ProblemsPopover onNavigate={() => setOpenPanel(null)} />}
      <UsageSummary onClick={() => toggle('usage')} />
      <ProblemsStatus onClick={() => toggle('problems')} />
      <ResourceStatus onClick={() => toggle('resources')} />
    </footer>
  )
}
