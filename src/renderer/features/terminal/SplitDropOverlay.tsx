import { areBothTerminals, dropTabOnSide } from '../../state/splitActions'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { DropSideOverlay } from './DropSideOverlay'
import { dropPartner, type DropSide } from './workspaceSplit'

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
  const setDraggedTab = useWorkspaceStore((state) => state.setDraggedTab)

  if (draggedTabId === null || partner === null) {
    return null
  }

  return (
    <DropSideOverlay
      hints={areBothTerminals(draggedTabId, partner) ? JOIN_HINT_BY_SIDE : HINT_BY_SIDE}
      onDrop={(side) => {
        dropTabOnSide(draggedTabId, side)
        setDraggedTab(null)
      }}
    />
  )
}
