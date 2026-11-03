import { useState, type DragEvent } from 'react'
import { dropSideAt, type DropSide } from './workspaceSplit'

interface DropSideOverlayProps {
  hints: Record<DropSide, string>
  onDrop: (side: DropSide) => void
}

export function DropSideOverlay({ hints, onDrop }: DropSideOverlayProps) {
  const [side, setSide] = useState<DropSide>('center')

  function follow(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const bounds = event.currentTarget.getBoundingClientRect()
    setSide(dropSideAt(event.clientX - bounds.left, event.clientY - bounds.top, bounds.width, bounds.height))
  }

  function drop(event: DragEvent<HTMLDivElement>): void {
    event.preventDefault()
    onDrop(side)
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
