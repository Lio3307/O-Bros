import { Panel, PanelGroup, PanelResizeHandle } from 'react-resizable-panels'
import type { TerminalTab } from '../../state/workspaceStore'
import { PaneFrame } from './PaneFrame'
import type { PaneLayout } from './paneTree'

interface PaneLayoutViewProps {
  tab: TerminalTab
  layout: PaneLayout
  isVisible: boolean
}

const MIN_PANE_SIZE_PERCENT = 15

export function PaneLayoutView({ tab, layout, isVisible }: PaneLayoutViewProps) {
  if (layout.kind === 'pane') {
    return <PaneFrame tab={tab} paneId={layout.paneId} isVisible={isVisible} />
  }

  return (
    <PanelGroup direction={layout.direction}>
      <Panel minSize={MIN_PANE_SIZE_PERCENT}>
        <PaneLayoutView tab={tab} layout={layout.first} isVisible={isVisible} />
      </Panel>
      <PanelResizeHandle className={`resize-handle resize-handle-${layout.direction}`} />
      <Panel minSize={MIN_PANE_SIZE_PERCENT}>
        <PaneLayoutView tab={tab} layout={layout.second} isVisible={isVisible} />
      </Panel>
    </PanelGroup>
  )
}
