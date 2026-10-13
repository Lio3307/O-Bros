import { PanelLeft, PanelRight } from 'lucide-react'
import { lastPathSegment } from '../../shared/paths'
import { useLayoutStore } from '../state/layoutStore'
import { useProjectsStore } from '../state/projectsStore'

export function TitleBar() {
  const section = useLayoutStore((state) => state.section)
  const sidebarMode = useLayoutStore((state) => state.sidebarMode)
  const isFilesPanelOpen = useLayoutStore((state) => state.isFilesPanelOpen)
  const toggleSidebarVisibility = useLayoutStore((state) => state.toggleSidebarVisibility)
  const toggleFilesPanel = useLayoutStore((state) => state.toggleFilesPanel)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)

  const projectName = activeProjectPath === null ? '' : ` — ${lastPathSegment(activeProjectPath)}`

  return (
    <header className="title-bar">
      <div className="title-bar-side">
        <button
          type="button"
          className={sidebarMode === 'hidden' ? 'icon-button' : 'icon-button icon-button-on'}
          title="Toggle sidebar"
          onClick={toggleSidebarVisibility}
        >
          <PanelLeft size={16} />
        </button>
      </div>
      <span className="title-bar-title">o-bros{projectName}</span>
      <div className="title-bar-side title-bar-side-right">
        {section === 'projects' && (
          <button
            type="button"
            className={isFilesPanelOpen ? 'icon-button icon-button-on' : 'icon-button'}
            title="Toggle files panel"
            onClick={toggleFilesPanel}
          >
            <PanelRight size={16} />
          </button>
        )}
      </div>
    </header>
  )
}
