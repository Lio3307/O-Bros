import { FolderPlus } from 'lucide-react'
import { useProjectsStore } from '../../state/projectsStore'
import './settings.css'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'

export function ProjectFoldersPage() {
  const roots = useProjectsStore((state) => state.roots)
  const addRoot = useProjectsStore((state) => state.addRoot)
  const removeRoot = useProjectsStore((state) => state.removeRoot)

  return (
    <SettingsPageLayout
      title="Project folders"
      description="o-bros only reads and edits files inside the folders listed here."
      actions={
        <>
          <Button variant="outline" onClick={() => void addRoot()}>
            <FolderPlus size={14} /> Add folder
          </Button>
        </>
      }
    >
      <div className="table">
        {roots.length === 0 && <p className="panel-empty">No folders added yet.</p>}
        {roots.map((root) => (
          <div key={root.path} className="table-row">
            <div className="cell cell-account">
              <span className="account-label">{root.name}</span>
              <span className="muted">{root.path}</span>
            </div>
            <Button
              variant="remove"
              title="Remove from this list. Your files are not deleted."
              onClick={() => void removeRoot(root.path)}
            >
              Remove
            </Button>
          </div>
        ))}
      </div>
    </SettingsPageLayout>
  )
}
