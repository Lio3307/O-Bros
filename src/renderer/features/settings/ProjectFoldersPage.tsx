import { FolderPlus } from 'lucide-react'
import { useProjectsStore } from '../../state/projectsStore'
import './settings.css'

export function ProjectFoldersPage() {
  const roots = useProjectsStore((state) => state.roots)
  const addRoot = useProjectsStore((state) => state.addRoot)
  const removeRoot = useProjectsStore((state) => state.removeRoot)

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1 className="settings-title">Project folders</h1>
          <p className="muted">o-bros only reads and edits files inside the folders listed here.</p>
        </div>
        <button type="button" className="button-outline" onClick={() => void addRoot()}>
          <FolderPlus size={14} /> Add folder
        </button>
      </header>
      <div className="table">
        {roots.length === 0 && <p className="panel-empty">No folders added yet.</p>}
        {roots.map((root) => (
          <div key={root.path} className="table-row">
            <div className="cell cell-account">
              <span className="account-label">{root.name}</span>
              <span className="muted">{root.path}</span>
            </div>
            <button
              type="button"
              className="button-remove"
              title="Remove from this list. Your files are not deleted."
              onClick={() => void removeRoot(root.path)}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
