import { useRef } from 'react'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { PaneDivider } from './PaneDivider'
import { PaneFrame } from './PaneFrame'
import { computePaneRects, listDividers, type PaneLayout, type PaneRect } from './paneTree'

interface PaneLayoutViewProps {
  tab: TerminalTab
  layout: PaneLayout
  isVisible: boolean
}

function placement(rect: PaneRect) {
  return { left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` }
}

export function PaneLayoutView({ tab, layout, isVisible }: PaneLayoutViewProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeSplit = useWorkspaceStore((state) => state.resizeSplit)

  const rectByPaneId = computePaneRects(layout)
  const dividers = listDividers(layout)

  return (
    <div className="pane-layout" ref={containerRef}>
      {Object.entries(rectByPaneId).map(([paneId, rect]) => (
        <div key={paneId} className="pane-slot" style={placement(rect)}>
          <PaneFrame tab={tab} paneId={paneId} isVisible={isVisible} />
        </div>
      ))}
      {dividers.map((divider) => (
        <PaneDivider
          key={divider.path.join('.')}
          divider={divider}
          containerRef={containerRef}
          onRatioChange={(ratio) => resizeSplit(tab.id, divider.path, ratio)}
        />
      ))}
    </div>
  )
}
