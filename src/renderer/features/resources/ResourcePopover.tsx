import { ChevronDown, ChevronRight, MemoryStick } from 'lucide-react'
import { useState } from 'react'
import { formatBytes, formatPercent } from '../../../shared/format'
import { lastPathSegment } from '../../../shared/paths'
import { useProjectsStore } from '../../state/projectsStore'
import { useResourcesStore } from '../../state/resourcesStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { RefreshButton } from '../../ui/RefreshButton'
import { LoadingText } from '../../ui/LoadingText'
import { groupTerminalsByWorkspace, type WorkspaceGroup } from './groupTerminals'
import { PortsSection } from './PortsSection'
import './resources.css'

function WorkspaceRows({ group }: { group: WorkspaceGroup }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const Chevron = isCollapsed ? ChevronRight : ChevronDown

  return (
    <>
      <button type="button" className="resource-row resource-row-group" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className="resource-name">
          <Chevron size={14} />
          {group.name} workspace
          {group.isSelectedProject && <span className="muted"> · selected</span>}
        </span>
        <span className="resource-number">{formatPercent(group.cpuPercent)}</span>
        <span className="resource-number resource-number-strong">{formatBytes(group.memoryBytes)}</span>
      </button>
      {!isCollapsed &&
        group.terminals.map((terminal) => (
          <div key={terminal.paneId} className="resource-row resource-row-terminal">
            <span className="resource-name">
              <span className="resource-dot" />
              {terminal.title}
            </span>
            <span className="resource-number">{formatPercent(terminal.cpuPercent)}</span>
            <span className="resource-number resource-number-strong">{formatBytes(terminal.memoryBytes)}</span>
          </div>
        ))}
    </>
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

  const groups =
    snapshot === null
      ? []
      : groupTerminalsByWorkspace(tabs.filter(isTerminalTab), roots, snapshot.terminals, activeProjectPath)

  return (
    <div className="resource-popover" role="dialog" aria-label="Resource manager">
      <header className="resource-header">
        <span className="resource-title">
          <MemoryStick size={16} />
          Resource Manager
        </span>
        <RefreshButton
          variant="icon"
          isBusy={isRefreshing}
          hasFailed={hasFailed}
          title="Measure again"
          onRefresh={() => void refresh()}
        />
      </header>

      {snapshot === null ? (
        <p className="panel-empty"><LoadingText text="Measuring…" /></p>
      ) : (
        <>
          <div className="resource-summary">
            <span>
              <strong>{formatPercent(snapshot.total.cpuPercent)}</strong> CPU
            </span>
            <span className="status-separator">·</span>
            <span>
              <strong>{formatBytes(snapshot.total.privateBytes)}</strong> memory
            </span>
            <span className="status-separator">·</span>
            <span title="Working set: also counts the system libraries the processes share, once per process">
              {formatBytes(snapshot.total.workingSetBytes)} with shared
            </span>
          </div>

          <div className="resource-row resource-head">
            <span className="resource-name">Name</span>
            <span className="resource-number">CPU</span>
            <span className="resource-number resource-number-strong">Memory</span>
          </div>

          <div className="resource-body">
            {groups.length === 0 && <p className="panel-empty">No terminals are running.</p>}
            {groups.map((group) => (
              <WorkspaceRows key={group.name} group={group} />
            ))}
            {snapshot.languageServers.length > 0 && (
              <div className="resource-row resource-row-group">
                <span className="resource-name">Language servers</span>
              </div>
            )}
            {snapshot.languageServers.map((server) => (
              <div key={server.sessionId} className="resource-row resource-row-terminal" title={server.rootPath}>
                <span className="resource-name">
                  <span className="resource-dot" />
                  {server.title} · {lastPathSegment(server.rootPath)}
                </span>
                <span className="resource-number">{formatPercent(server.cpuPercent)}</span>
                <span className="resource-number resource-number-strong">{formatBytes(server.privateBytes)}</span>
              </div>
            ))}
            <div className="resource-row resource-row-app">
              <span className="resource-name">o-bros app</span>
              <span className="resource-number">{formatPercent(snapshot.app.cpuPercent)}</span>
              <span className="resource-number resource-number-strong">{formatBytes(snapshot.app.privateBytes)}</span>
            </div>
          </div>

          <PortsSection />

          <p className="resource-footnote">
            Memory is what each process uses by itself, like the Memory column in Task Manager. &quot;With shared&quot; also
            counts the system libraries every process loads, once per process, so it is larger. Terminal rows include the
            shell and everything it started, and language servers include the helpers they start.
          </p>
        </>
      )}
    </div>
  )
}
