import { FolderPlus } from 'lucide-react'
import type { ReactNode } from 'react'
import { useProjectsStore } from '../../state/projectsStore'
import { cn } from '../../ui/cn'
import { useFileDropTarget } from '../files/useFileDropTarget'

export function ProjectsDropZone({ className, children }: { className: string; children: ReactNode }) {
  const addDroppedRoots = useProjectsStore((state) => state.addDroppedRoots)
  const { isDropTarget, dropHandlers } = useFileDropTarget((paths) => void addDroppedRoots(paths))

  return (
    <div className={cn(className, 'projects-drop-zone', isDropTarget && 'projects-drop-zone-active')} {...dropHandlers}>
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
