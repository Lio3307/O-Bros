import { useState, type DragEvent } from 'react'
import { dropTabOnSide } from '../../state/splitActions'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { dropPartner, dropSideAt, type DropSide } from './workspaceSplit'

const HINT_BY_SIDE: Record<DropSide, string> = {
  left: 'Show on the left',
  right: 'Show on the right',
  top: 'Show on top',
  bottom: 'Show below',
  center: 'Drop on a side to see both tabs'
}

export function SplitDropOverlay() {
  const draggedTabId = useWorkspaceStore((state) => state.draggedTabId)
  const canSplit = useWorkspaceStore((state) => state.draggedTabId !== null && dropPartner(state.split, state.activeTabId, state.draggedTabId) !== null)
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
        <span className="split-drop-hint">{HINT_BY_SIDE[side]}</span>
      </div>
    </div>
  )
}
