import { useState, type DragEvent } from 'react'
import { areBothTerminals, dropTabOnSide } from '../../state/splitActions'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { dropPartner, dropSideAt, type DropSide } from './workspaceSplit'

const HINT_BY_SIDE: Record<DropSide, string> = {
  left: 'Show on the left',
  right: 'Show on the right',
  top: 'Show on top',
  bottom: 'Show below',
  center: 'Drop on a side to see both tabs'
}

const JOIN_HINT_BY_SIDE: Record<DropSide, string> = {
  left: 'Join this tab, on the left',
  right: 'Join this tab, on the right',
  top: 'Join this tab, on top',
  bottom: 'Join this tab, below',
  center: 'Drop on a side to put both terminals in one tab'
}

export function SplitDropOverlay() {
  const draggedTabId = useWorkspaceStore((state) => state.draggedTabId)
  const partner = useWorkspaceStore((state) => (state.draggedTabId === null ? null : dropPartner(state.split, state.activeTabId, state.draggedTabId)))
  const canSplit = partner !== null
  const hints = areBothTerminals(draggedTabId, partner) ? JOIN_HINT_BY_SIDE : HINT_BY_SIDE
  const setDraggedTab = useWorkspaceStore((state) => state.setDraggedTab)
  const [side, setSide] = useState<DropSide>('center')

  if (draggedTabId === null || !canSplit) {
    return null
  }

  function follow(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const bounds = event.currentTarget.getBoundingClientRect()
    setSide(dropSideAt(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height))
  }

  function drop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    if (draggedTabId !== null) {
      dropTabOnSide(draggedTabId, side)
    }
    setDraggedTab(null)
    setSide('center')
  }

  return (
    <div className="split-drop-overlay" data-side={side} onDragOver={follow} onDrop={drop}>
      <div className="split-drop-area">
        <span className="split-drop-hint">{hints[side]}</span>
      </div>
    </div>
  )
}
