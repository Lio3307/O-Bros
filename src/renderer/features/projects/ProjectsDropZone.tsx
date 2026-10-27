import { FolderPlus } from 'lucide-react'
import { useState, type DragEvent, type ReactNode } from 'react'
import { useProjectsStore } from '../../state/projectsStore'
import { cn } from '../../ui/cn'
import { acceptsDroppedPaths, droppedPaths } from '../files/dragData'

export function ProjectsDropZone({ className, children }: { className: string; children: ReactNode }) {
  const addDroppedRoots = useProjectsStore((state) => state.addDroppedRoots)
  const [isDropTarget, setIsDropTarget] = useState(false)

  function showDropTarget(event: DragEvent): void {
    if (!acceptsDroppedPaths(event.dataTransfer)) {
      return
    }
    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
    setIsDropTarget(true)
  }

  function hideDropTarget(event: DragEvent): void {
    if (!(event.relatedTarget instanceof Node && event.currentTarget.contains(event.relatedTarget))) {
      setIsDropTarget(false)
    }
  }

  function addDroppedFolders(event: DragEvent): void {
    setIsDropTarget(false)
    if (!acceptsDroppedPaths(event.dataTransfer)) {
      return
    }
    event.preventDefault()
    const paths = droppedPaths(event.dataTransfer)
    if (paths.length > 0) {
      void addDroppedRoots(paths)
    }
  }

  return (
    <div
      className={cn(className, 'projects-drop-zone', isDropTarget && 'projects-drop-zone-active')}
      onDragOver={showDropTarget}
      onDragLeave={hideDropTarget}
      onDrop={addDroppedFolders}
    >
      {children}
      {isDropTarget && (
        <div className="projects-drop-hint" aria-hidden="true">
          <FolderPlus size={22} />
          <span>Drop folders to add them as projects</span>
        </div>
      )}
    </div>
  )
}
