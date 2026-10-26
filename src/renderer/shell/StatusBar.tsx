import { CircleAlert, MemoryStick, Terminal, TriangleAlert } from 'lucide-react'
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react'
import { formatBytes } from '../../shared/format'
import { terminalsUsage } from '../../shared/processUsage'
import type { PlanUsage } from '../../shared/planUsage'
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
import { useLiveRefresh } from '../ui/useLiveRefresh'
import { UsagePopover } from './UsagePopover'

type OpenPanel = 'usage' | 'resources' | 'problems' | null

const USAGE_TEXT_REFRESH_MS = 30_000
const RESOURCE_POLL_IDLE_MS = 60_000
const RESOURCE_POLL_OPEN_MS = 3_000
const APP_MEMORY_POLL_MS = 5_000

const PROVIDERS: ProviderId[] = ['claude', 'codex']

const PROVIDER_NAMES: Record<ProviderId, string> = { claude: 'Claude', codex: 'Codex' }

interface UsageSource {
  key: string
  name: string
  mark: (size: number) => ReactNode
  windows: LabeledWindow[]
  errorMessage: string | null
  usage: KnownUsage | undefined
}

function measuredText(usage: KnownUsage | undefined): string {
  if (usage === undefined || !usage.isStale || usage.measuredAt === null) {
    return ''
  }
  return ` (last known, ${new Date(usage.measuredAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })})`
}

function describeSource(source: UsageSource): string {
  if (source.windows.length === 0) {
    return `${source.name}: ${source.errorMessage ? 'unavailable' : 'not read yet'}`
  }
  const parts = source.windows.map(({ label, window }) => `${label} ${window.percentUsed}%`)
  return `${source.name}: ${parts.join(', ')}${measuredText(source.usage)}`
}

function planSource(plan: PlanUsage): UsageSource {
  return {
    key: plan.id,
    name: plan.name,
    mark: (size) => <AgentIcon command={plan.logoCommand} size={size} />,
    windows: plan.windows,
    errorMessage: plan.errorMessage,
    usage: undefined
  }
}

function useUsageSources(): UsageSource[] {
  const accountsState = useAccountsStore()
  const usageByAccountId = useUsageStore((state) => state.usageByAccountId)
  const plans = useUsageStore((state) => state.plans)
  const hiddenSources = useUsageVisibilityStore((state) => state.hiddenSources)
  const providers = PROVIDERS.flatMap((provider): UsageSource[] => {
    const account = selectActiveAccount(accountsState, provider)
    if (account === null) {
      return []
    }
    const usage = usageByAccountId[account.id]
    return [
      {
        key: provider,
        name: PROVIDER_NAMES[provider],
        mark: (size) => <ProviderMark provider={provider} size={size} />,
        windows: listUsageWindows(usage),
        errorMessage: usage?.errorMessage ?? null,
        usage
      }
    ]
  })
  return [...providers, ...plans.map(planSource)].filter((source) => !hiddenSources.includes(source.key))
}

function UsageSummary({ onClick }: { onClick: () => void }) {
  const sources = useUsageSources()
  const now = useNow(USAGE_TEXT_REFRESH_MS)
  if (sources.length === 0) {
    return null
  }

  const pressing = mostPressingWindow(sources)
  const lead = sources.find((source) => source.key === pressing?.key) ?? sources[0]
  const others = sources.filter((source) => source !== lead)
  const hasError = sources.some((source) => source.windows.length === 0 && source.errorMessage)
  const compact = pressing === null ? null : describeCompactWindow(pressing.window, now)

  return (
    <>
      <button
        type="button"
        className="status-usage"
        title={[...sources.map(describeSource), 'Click for details'].join('\n')}
        onClick={onClick}
      >
        {lead.mark(16)}
        {pressing === null && <span>{hasError ? 'unavailable' : '—'}</span>}
        {pressing !== null && compact !== null && (
          <span className={cn('status-window', isUsageHigh(pressing.window.percentUsed) && 'usage-high')}>
            <span className="status-window-label">{pressing.label}</span>
            <span className="status-percent">{compact.percent}</span>
            <span className="status-window-reset">{compact.remaining}</span>
          </span>
        )}
        {others.length > 0 && (
          <span className="status-other-marks">
            {others.map((source) => (
              <Fragment key={source.key}>{source.mark(12)}</Fragment>
            ))}
          </span>
        )}
      </button>
      <AccountsRefreshButton variant="icon" iconSize={12} />
    </>
  )
}

function ResourceStatus({ onClick }: { onClick: () => void }) {
  const snapshot = useResourcesStore((state) => state.snapshot)
  const memoryText = snapshot === null ? '—' : formatBytes(snapshot.app.privateBytes)
  const terminalCount = snapshot === null ? 0 : snapshot.terminals.length
  const title =
    snapshot === null
      ? 'Memory used by O-BROS. Click for details.'
      : [
          `O-BROS: ${formatBytes(snapshot.app.privateBytes)} (like its entry in Task Manager)`,
          `In your terminals: ${formatBytes(terminalsUsage(snapshot).privateBytes)} (agents and programs you started; Task Manager lists them separately)`,
          'Click for details.'
        ].join('\n')

  return (
    <button type="button" className="status-usage status-resources" title={title} onClick={onClick}>
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

  useLiveRefresh(poll, isPanelOpen ? RESOURCE_POLL_OPEN_MS : RESOURCE_POLL_IDLE_MS, { refreshNow: true })
  useLiveRefresh(pollApp, APP_MEMORY_POLL_MS)
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
