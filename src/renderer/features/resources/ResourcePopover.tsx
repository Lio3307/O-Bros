import { MemoryStick } from 'lucide-react'
import { DisclosureChevron } from '../../ui/DisclosureChevron'
import { useState } from 'react'
import { formatBytes, formatPercent } from '../../../shared/format'
import { terminalsUsage } from '../../../shared/processUsage'
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

  return (
    <>
      <button type="button" className="resource-row resource-row-group" onClick={() => setIsCollapsed(!isCollapsed)}>
        <span className="resource-name">
          <DisclosureChevron isOpen={!isCollapsed} />
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
            <span className="resource-name">Name</span>
            <span className="resource-number">CPU</span>
            <span className="resource-number resource-number-strong">Memory</span>
          </div>

          <div className="resource-body">
            <div className="resource-row resource-row-app">
              <span className="resource-name">O-BROS itself</span>
              <span className="resource-number">{formatPercent(snapshot.app.cpuPercent)}</span>
              <span className="resource-number resource-number-strong">{formatBytes(snapshot.app.privateBytes)}</span>
            </div>
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
          </div>

          <PortsSection />

          <p className="resource-footnote">
            Memory is what each program uses by itself, like the Memory column in Task Manager. O-BROS is only the app.
            Each terminal row adds up its shell and everything started in it, such as an agent; Task Manager shows those
            as separate apps, so they are not part of the O-BROS number.
          </p>
        </>
      )}
    </div>
  )
}
