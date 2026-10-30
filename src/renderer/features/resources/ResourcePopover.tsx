import { Braces, Folder, Info, MemoryStick } from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { formatBytes, formatPercent } from '../../../shared/format'
import { terminalsUsage } from '../../../shared/processUsage'
import { lastPathSegment } from '../../../shared/paths'
import { useProjectsStore } from '../../state/projectsStore'
import { useResourcesStore } from '../../state/resourcesStore'
import { showTab } from '../../state/showTab'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { DisclosureChevron } from '../../ui/DisclosureChevron'
import { LoadingText } from '../../ui/LoadingText'
import { RefreshButton } from '../../ui/RefreshButton'
import { belongsToProject } from '../terminal/projectTabs'
import { TerminalTabIcon } from '../terminal/TerminalTabIcon'
import { groupTerminalsByWorkspace, type TerminalRow, type WorkspaceGroup } from './groupTerminals'
import { PortsSection } from './PortsSection'
import './resources.css'

const MEMORY_EXPLAINED =
  'Memory each program uses by itself, like the Memory column in Task Manager. O-BROS is only the app. Each terminal adds up its shell and everything started in it, such as an agent; Task Manager lists those as separate apps.'

interface UsageRowProps {
  icon: ReactNode
  name: string
  detail?: string
  cpuPercent: number
  memoryBytes: number
  largestBytes: number
  title?: string
  onOpen?: () => void
}

function UsageRow({ icon, name, detail, cpuPercent, memoryBytes, largestBytes, title, onOpen }: UsageRowProps) {
  const share = largestBytes > 0 ? Math.max(2, (memoryBytes / largestBytes) * 100) : 0
  const content = (
    <>
      <span className="resource-name">
        <span className="resource-icon">{icon}</span>
        <span className="resource-label">
          <span className="resource-label-text">
            {name}
            {detail !== undefined && <span className="muted"> · {detail}</span>}
          </span>
          <span className="resource-bar" style={{ width: `${share}%` }} />
        </span>
      </span>
      <span className="resource-number">{formatPercent(cpuPercent)}</span>
      <span className="resource-number resource-number-strong">{formatBytes(memoryBytes)}</span>
    </>
  )
  return onOpen === undefined ? (
    <div className="resource-row resource-row-item" title={title}>
      {content}
    </div>
  ) : (
    <button type="button" className="resource-row resource-row-item resource-row-open" title={title ?? `Open ${name}`} onClick={onOpen}>
      {content}
    </button>
  )
}

function openTerminal(row: TerminalRow, group: WorkspaceGroup): void {
  const { activeProjectPath, selectProject } = useProjectsStore.getState()
  if (group.path !== null && !belongsToProject(row.tab, activeProjectPath)) {
    selectProject(group.path)
  }
  showTab(row.tab.id)
}

function WorkspaceRows({ group, largestBytes }: { group: WorkspaceGroup; largestBytes: number }) {
  const [isCollapsed, setIsCollapsed] = useState(false)

  return (
    <div className="resource-group">
      <button type="button" className="resource-row resource-row-group" aria-expanded={!isCollapsed} onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className="resource-name">
          <DisclosureChevron isOpen={!isCollapsed} />
          <Folder size={14} />
          <span className="resource-label-text">{group.name}</span>
          {group.isSelectedProject && <span className="resource-tag">selected</span>}
        </span>
        <span className="resource-number">{formatPercent(group.cpuPercent)}</span>
        <span className="resource-number resource-number-strong">{formatBytes(group.memoryBytes)}</span>
      </button>
      {!isCollapsed &&
        group.terminals.map((row) => (
          <UsageRow
            key={row.paneId}
            icon={<TerminalTabIcon tab={row.tab} />}
            name={row.title}
            cpuPercent={row.cpuPercent}
            memoryBytes={row.memoryBytes}
            largestBytes={largestBytes}
            onOpen={() => openTerminal(row, group)}
          />
        ))}
    </div>
  )
}

export function ResourcePopover() {
  const snapshot = useResourcesStore((state) => state.snapshot)
  const isRefreshing = useResourcesStore((state) => state.isRefreshing)
  const hasFailed = useResourcesStore((state) => state.hasFailed)
  const refresh = useResourcesStore((state) => state.refresh)
  const tabs = useWorkspaceStore((state) => state.tabs)
  const roots = useProjectsStore((state) => state.roots)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)

  const groups = snapshot === null ? [] : groupTerminalsByWorkspace(tabs.filter(isTerminalTab), roots, snapshot.terminals, activeProjectPath)
  const largestBytes = Math.max(
    0,
    ...groups.flatMap((group) => group.terminals.map((row) => row.memoryBytes)),
    ...(snapshot?.languageServers.map((server) => server.privateBytes) ?? [])
  )

  return (
    <div className="resource-popover" role="dialog" aria-label="Resource manager">
      <header className="resource-header">
        <span className="resource-title">
          <MemoryStick size={16} />
          Resource Manager
        </span>
        <RefreshButton variant="icon" isBusy={isRefreshing} hasFailed={hasFailed} title="Measure again" onRefresh={() => void refresh()} />
      </header>

      {snapshot === null ? (
        <p className="panel-empty">
          <LoadingText text="Measuring…" />
        </p>
      ) : (
        <>
          <div className="resource-summary">
            <div
              className="resource-stat"
              title={`O-BROS itself, like its own entry in Task Manager. Counting the system libraries it shares with other programs: ${formatBytes(snapshot.app.workingSetBytes)}.`}
            >
              <span className="resource-stat-label">O-BROS</span>
              <span className="resource-stat-value">{formatBytes(snapshot.app.privateBytes)}</span>
              <span className="resource-stat-detail">{formatPercent(snapshot.app.cpuPercent)} CPU</span>
            </div>
            <div className="resource-stat" title="Agents, shells and programs you started in O-BROS terminals. Task Manager lists them as their own apps, for example Claude Code or node.">
              <span className="resource-stat-label">In your terminals</span>
              <span className="resource-stat-value">{formatBytes(terminalsUsage(snapshot).privateBytes)}</span>
              <span className="resource-stat-detail">
                {snapshot.terminals.length === 1 ? '1 terminal' : `${snapshot.terminals.length} terminals`} · {formatPercent(terminalsUsage(snapshot).cpuPercent)} CPU
              </span>
            </div>
          </div>

          <div className="resource-row resource-head">
            <span className="resource-name">Running</span>
            <span className="resource-number">CPU</span>
            <span className="resource-number resource-number-strong" title={MEMORY_EXPLAINED}>
              Memory <Info size={11} className="resource-info" />
            </span>
          </div>

          <div className="resource-body">
            {groups.length === 0 && <p className="panel-empty">No terminals are running.</p>}
            {groups.map((group) => (
              <WorkspaceRows key={group.name} group={group} largestBytes={largestBytes} />
            ))}
            {snapshot.languageServers.length > 0 && (
              <div className="resource-group">
                <div className="resource-row resource-row-group resource-row-static">
                  <span className="resource-name">
                    <Braces size={14} />
                    <span className="resource-label-text">Language servers</span>
                  </span>
                </div>
                {snapshot.languageServers.map((server) => (
                  <UsageRow
                    key={server.sessionId}
                    icon={<Braces size={14} />}
                    name={server.title}
                    detail={lastPathSegment(server.rootPath)}
                    title={server.rootPath}
                    cpuPercent={server.cpuPercent}
                    memoryBytes={server.privateBytes}
                    largestBytes={largestBytes}
                  />
                ))}
              </div>
            )}
            <PortsSection />
          </div>
        </>
      )}
    </div>
  )
}
