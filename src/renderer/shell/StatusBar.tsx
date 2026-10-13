import { CircleAlert, MemoryStick, Terminal, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { formatBytes } from '../../shared/format'
import type { ProviderId } from '../../shared/types'
import { ProblemsPopover } from '../features/problems/ProblemsPopover'
import { ResourcePopover } from '../features/resources/ResourcePopover'
import { selectActiveAccount, useAccountsStore } from '../state/accountsStore'
import { countProblems, useProblemsStore } from '../state/problemsStore'
import { useResourcesStore } from '../state/resourcesStore'
import { useUsageStore } from '../state/usageStore'
import { useUsageVisibilityStore } from '../state/usageVisibilityStore'
import { AccountsRefreshButton } from '../ui/AccountsRefreshButton'
import { ProviderMark } from '../ui/ProviderMark'
import { describeCompactWindow, listUsageWindows } from '../ui/usageText'
import { useNow } from '../ui/useNow'
import { UsagePopover } from './UsagePopover'

type OpenPanel = 'usage' | 'resources' | 'problems' | null

const USAGE_TEXT_REFRESH_MS = 30_000
const RESOURCE_POLL_IDLE_MS = 15_000
const RESOURCE_POLL_OPEN_MS = 3_000

const WINDOW_NAMES: Record<string, string> = { '5h': '5-hour limit', wk: 'Weekly limit' }

function ProviderUsage({ provider, onClick }: { provider: ProviderId; onClick: () => void }) {
  const account = useAccountsStore((state) => selectActiveAccount(state, provider))
  const usage = useUsageStore((state) => (account === null ? undefined : state.usageByAccountId[account.id]))
  const isHidden = useUsageVisibilityStore((state) => state.hiddenProviders.includes(provider))
  const now = useNow(USAGE_TEXT_REFRESH_MS)

  if (account === null || isHidden) {
    return null
  }

  const windows = listUsageWindows(usage)

  return (
    <button type="button" className="status-usage" title="Show usage" onClick={onClick}>
      <ProviderMark provider={provider} size={16} />
      {windows.length === 0 && <span>{usage?.errorMessage ? 'unavailable' : '—'}</span>}
      {windows.map(({ label, window }) => {
        const { percent, remaining } = describeCompactWindow(window, now)
        return (
          <span
            key={label}
            className="status-window"
            title={`${WINDOW_NAMES[label] ?? label}: ${percent} used, resets in ${remaining}`}
          >
            <span className="status-window-label">{label}</span>
            <span className="status-percent">{percent}</span>
            <span className="status-window-reset">{remaining}</span>
          </span>
        )
      })}
    </button>
  )
}

function ResourceStatus({ onClick }: { onClick: () => void }) {
  const snapshot = useResourcesStore((state) => state.snapshot)
  const memoryText = snapshot === null ? '—' : formatBytes(snapshot.total.workingSetBytes)
  const terminalCount = snapshot === null ? 0 : snapshot.terminals.length

  return (
    <button type="button" className="status-usage status-resources" title="Memory and terminals" onClick={onClick}>
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

  useEffect(() => {
    void poll()
    const interval = isPanelOpen ? RESOURCE_POLL_OPEN_MS : RESOURCE_POLL_IDLE_MS
    const timer = setInterval(() => void poll(), interval)
    return () => clearInterval(timer)
  }, [poll, isPanelOpen])
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
  const hiddenProviders = useUsageVisibilityStore((state) => state.hiddenProviders)
  const hasVisibleUsage = hiddenProviders.length < 2

  function toggle(panel: Exclude<OpenPanel, null>): void {
    setOpenPanel(openPanel === panel ? null : panel)
  }

  return (
    <footer className="status-bar" ref={containerRef}>
      {openPanel === 'usage' && <UsagePopover onNavigate={() => setOpenPanel(null)} />}
      {openPanel === 'resources' && <ResourcePopover />}
      {openPanel === 'problems' && <ProblemsPopover onNavigate={() => setOpenPanel(null)} />}
      <ProviderUsage provider="claude" onClick={() => toggle('usage')} />
      <ProviderUsage provider="codex" onClick={() => toggle('usage')} />
      {hasVisibleUsage && <AccountsRefreshButton variant="icon" iconSize={12} />}
      <ProblemsStatus onClick={() => toggle('problems')} />
      <ResourceStatus onClick={() => toggle('resources')} />
    </footer>
  )
}
