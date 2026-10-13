import { Columns2, Rows2, X } from 'lucide-react'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { EditableTitle } from '../../ui/EditableTitle'
import { TerminalView } from './TerminalView'

interface PaneFrameProps {
  tab: TerminalTab
  paneId: string
  isVisible: boolean
}

export function PaneFrame({ tab, paneId, isVisible }: PaneFrameProps) {
  const splitPane = useWorkspaceStore((state) => state.splitPane)
  const closePane = useWorkspaceStore((state) => state.closePane)
  const renamePane = useWorkspaceStore((state) => state.renamePane)
  const focusPane = useWorkspaceStore((state) => state.focusPane)

  const pane = tab.panes[paneId]
  const hasSeveralPanes = Object.keys(tab.panes).length > 1
  const isFocused = hasSeveralPanes && tab.focusedPaneId === paneId
  const frameClassName = isFocused ? 'pane-frame pane-frame-focused' : 'pane-frame'

  return (
    <div className={frameClassName} onMouseDown={() => focusPane(tab.id, paneId)}>
      {hasSeveralPanes && (
        <div className="pane-header">
          <EditableTitle
            className="pane-title"
            value={pane.title}
            onCommit={(title) => renamePane(tab.id, paneId, title)}
          />
          <div className="pane-actions">
            <button type="button" title="Split right" onClick={() => splitPane(tab.id, paneId, 'horizontal')}>
              <Columns2 size={14} />
            </button>
            <button type="button" title="Split down" onClick={() => splitPane(tab.id, paneId, 'vertical')}>
              <Rows2 size={14} />
            </button>
            <button type="button" title="Close pane" onClick={() => closePane(tab.id, paneId)}>
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
        isVisible={isVisible}
      />
    </div>
  )
}
