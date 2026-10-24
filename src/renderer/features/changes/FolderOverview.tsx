import { Folder } from 'lucide-react'
import { MISSING_FOLDER_MESSAGE } from '../../../shared/friendlyError'
import { lastPathSegment } from '../../../shared/paths'
import { useIsInMissingProject } from '../../state/missingProject'
import { RepositoryPicker } from './RepositoryPicker'
import './changes.css'

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
          <span className="folder-overview-path muted" title={folderPath}>
            {folderPath}
          </span>
        </span>
      </header>
      <p className="muted">{isMissing ? MISSING_FOLDER_MESSAGE : message}</p>
      {!isMissing && <RepositoryPicker folderPath={folderPath} />}
    </div>
  )
}
