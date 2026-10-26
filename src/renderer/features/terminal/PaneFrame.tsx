import { Columns2, Rows2, X } from 'lucide-react'
import { isAgentCommand } from '../../../shared/agentLaunchers'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { requestClosePane } from '../../state/requestCloseTab'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { useShortcutLabel } from '../../state/shortcutsStore'
import { EditableTitle } from '../../ui/EditableTitle'
import { PaneAgentStatus } from './PaneAgentStatus'
import { TerminalView } from './TerminalView'

interface PaneFrameProps {
  tab: TerminalTab
  paneId: string
  isVisible: boolean
}

export function PaneFrame({ tab, paneId, isVisible }: PaneFrameProps) {
  const splitPane = useWorkspaceStore((state) => state.splitPane)
  const renamePane = useWorkspaceStore((state) => state.renamePane)
  const focusPane = useWorkspaceStore((state) => state.focusPane)
  const splitRightLabel = useShortcutLabel('splitRight')
  const splitDownLabel = useShortcutLabel('splitDown')
  const closePaneLabel = useShortcutLabel('closePane')
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)

  const pane = tab.panes[paneId]
  const hasSeveralPanes = Object.keys(tab.panes).length > 1
  const isFocused = hasSeveralPanes && tab.focusedPaneId === paneId
  const frameClassName = isFocused ? 'pane-frame pane-frame-focused' : 'pane-frame'

  return (
    <div className={frameClassName} onMouseDown={() => focusPane(tab.id, paneId)}>
      {hasSeveralPanes && (
        <div className="pane-header">
          <span className="pane-heading">
            <PaneAgentStatus pane={pane} />
            <EditableTitle
            className="pane-title"
            value={pane.title}
              onCommit={(title) => renamePane(tab.id, paneId, title)}
            />
          </span>
          <div className="pane-actions">
            <button type="button" title={`Split right (${splitRightLabel})`} onClick={() => splitPane(tab.id, paneId, 'horizontal')}>
              <Columns2 size={14} />
            </button>
            <button type="button" title={`Split down (${splitDownLabel})`} onClick={() => splitPane(tab.id, paneId, 'vertical')}>
              <Rows2 size={14} />
            </button>
            <button type="button" title={`Close pane (${closePaneLabel})`} onClick={() => requestClosePane(tab.id, paneId)}>
              <X size={14} />
            </button>
          </div>
        </div>
      )}
      <TerminalView
        paneId={paneId}
        cwd={pane.cwd}
        account={pane.account}
        startCommand={pane.startCommand}
        startsAgent={isAgentCommand(pane.startCommand, launchers, registry)}
        isVisible={isVisible}
        isFocusTarget={tab.focusedPaneId === paneId}
      />
    </div>
  )
}
