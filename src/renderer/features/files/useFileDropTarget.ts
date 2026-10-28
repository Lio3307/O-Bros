import { useState, type DragEvent } from 'react'
import { acceptsDroppedPaths, droppedPaths } from './dragData'

export interface FileDropHandlers {
  onDragOver: (event: DragEvent) => void
  onDragLeave: (event: DragEvent) => void
  onDrop: (event: DragEvent) => void
}

export function useFileDropTarget(onDropPaths: (paths: string[]) => void): { isDropTarget: boolean; dropHandlers: FileDropHandlers } {
  const [isDropTarget, setIsDropTarget] = useState(false)

  function onDragOver(event: DragEvent): void {
    if (!acceptsDroppedPaths(event.dataTransfer)) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDropTarget(true)
  }

  function onDragLeave(event: DragEvent): void {
    const isStillInside = event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget)
    if (!isStillInside) {
      setIsDropTarget(false)
    }
  }

  function onDrop(event: DragEvent): void {
    setIsDropTarget(false)
    if (!acceptsDroppedPaths(event.dataTransfer)) {
      return
    }
    event.preventDefault()
    const paths = droppedPaths(event.dataTransfer)
    if (paths.length > 0) {
      onDropPaths(paths)
    }
  }

  return { isDropTarget, dropHandlers: { onDragOver, onDragLeave, onDrop } }
}
