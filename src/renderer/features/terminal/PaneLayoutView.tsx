import { useRef } from 'react'
import { useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { cn } from '../../ui/cn'
import { DropSideOverlay } from './DropSideOverlay'
import { PaneDivider } from './PaneDivider'
import { PaneFrame } from './PaneFrame'
import { computePaneRects, listDividers, type PaneRect } from './paneTree'
import type { DropSide } from './workspaceSplit'

const PANE_HINT_BY_SIDE: Record<DropSide, string> = {
  left: 'Move here, on the left',
  right: 'Move here, on the right',
  top: 'Move here, on top',
  bottom: 'Move here, below',
  center: 'Drop on a side to move the pane there'
}

export const WHOLE_AREA: PaneRect = { left: 0, top: 0, width: 100, height: 100 }

export function placement(rect: PaneRect) {
  return { left: `${rect.left}%`, top: `${rect.top}%`, width: `${rect.width}%`, height: `${rect.height}%` }
}

function inside(area: PaneRect, rect: PaneRect): PaneRect {
  return {
    left: area.left + (rect.left * area.width) / 100,
    top: area.top + (rect.top * area.height) / 100,
    width: (rect.width * area.width) / 100,
    height: (rect.height * area.height) / 100
  }
}

export interface PlacedTerminalTab {
  tab: TerminalTab
  area: PaneRect
  isShown: boolean
}

interface TerminalPanesProps {
  placedTabs: PlacedTerminalTab[]
  isVisible: boolean
  activeTabId: string | null
}

export function TerminalPanes({ placedTabs, isVisible, activeTabId }: TerminalPanesProps) {
  const activateTab = useWorkspaceStore((state) => state.activateTab)
  const draggedPaneId = useWorkspaceStore((state) => state.draggedPaneId)
  const setDraggedPane = useWorkspaceStore((state) => state.setDraggedPane)
  const movePane = useWorkspaceStore((state) => state.movePane)

  return placedTabs.flatMap(({ tab, area, isShown }) =>
    Object.entries(computePaneRects(tab.layout)).map(([paneId, rect]) => (
      <div
        key={paneId}
        className={cn('pane-slot', !isShown && 'pane-slot-hidden')}
        style={placement(inside(area, rect))}
        onMouseDownCapture={() => isShown && tab.id !== activeTabId && activateTab(tab.id)}
      >
        <PaneFrame tab={tab} paneId={paneId} isVisible={isVisible && isShown} isFocusedSide={tab.id === activeTabId} />
        {isShown && draggedPaneId !== null && draggedPaneId !== paneId && draggedPaneId in tab.panes && (
          <DropSideOverlay
            hints={PANE_HINT_BY_SIDE}
            onDrop={(side) => {
              setDraggedPane(null)
              if (side !== 'center') {
                movePane(tab.id, draggedPaneId, paneId, side)
              }
            }}
          />
        )}
      </div>
    ))
  )
}

export function PaneDividers({ tab }: { tab: TerminalTab }) {
  const containerRef = useRef<HTMLDivElement>(null)
  const resizeSplit = useWorkspaceStore((state) => state.resizeSplit)

  return (
    <div className="pane-layout" ref={containerRef}>
      {listDividers(tab.layout).map((divider) => (
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
