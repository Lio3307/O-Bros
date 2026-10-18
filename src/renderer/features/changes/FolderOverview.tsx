import { Folder } from 'lucide-react'
import { lastPathSegment } from '../../../shared/paths'
import { RepositoryPicker } from './RepositoryPicker'
import './changes.css'

export function FolderOverview({ folderPath, message }: { folderPath: string; message: string }) {
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
      <p className="muted">{message}</p>
      <RepositoryPicker folderPath={folderPath} />
    </div>
  )
}
