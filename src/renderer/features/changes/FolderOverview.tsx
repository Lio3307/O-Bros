import { ChevronRight, Folder } from 'lucide-react'
import { folderTrail } from '../../../shared/folderTrail'
import { MISSING_FOLDER_MESSAGE } from '../../../shared/friendlyError'
import { lastPathSegment } from '../../../shared/paths'
import { useGitRepositoryStore } from '../../state/gitRepositoryStore'
import { useIsInMissingProject } from '../../state/missingProject'
import { useProjectsStore } from '../../state/projectsStore'
import { RepositoryPicker } from './RepositoryPicker'
import './changes.css'

function FolderTrail({ folderPath }: { folderPath: string }) {
  const projectPath = useProjectsStore((state) => state.activeProjectPath)
  const openRepository = useGitRepositoryStore((state) => state.open)
  const followProject = useGitRepositoryStore((state) => state.followProject)
  const steps = folderTrail(projectPath, folderPath)

  if (steps.length === 1) {
    return (
      <span className="folder-overview-path muted" title={folderPath}>
        {folderPath}
      </span>
    )
  }
  return (
    <nav className="folder-trail" aria-label="Where this folder is">
      {steps.map((step, index) => {
        const isLast = index === steps.length - 1
        return (
          <span key={step.path} className="folder-trail-step">
            {isLast ? (
              <span className="folder-trail-current" aria-current="location">
                {step.name}
              </span>
            ) : (
              <button
                type="button"
                className="folder-trail-link"
                title={`Go to ${step.path}`}
                onClick={() => (step.path === projectPath ? followProject() : openRepository(step.path, projectPath))}
              >
                {step.name}
              </button>
            )}
            {!isLast && <ChevronRight size={12} className="folder-trail-arrow" aria-hidden="true" />}
          </span>
        )
      })}
    </nav>
  )
}

export function FolderOverview({ folderPath, message }: { folderPath: string; message: string }) {
  const isMissing = useIsInMissingProject(folderPath)
  return (
    <div className="folder-overview">
      <header className="folder-overview-header">
        <Folder size={20} />
        <span className="folder-overview-text">
          <span className="folder-overview-name" title={folderPath}>
            {lastPathSegment(folderPath)}
          </span>
          <FolderTrail folderPath={folderPath} />
        </span>
      </header>
      <p className="muted">{isMissing ? MISSING_FOLDER_MESSAGE : message}</p>
      {!isMissing && !message.includes('not trusted') && <RepositoryPicker folderPath={folderPath} />}
    </div>
  )
}
