import { useEffect } from 'react'
import { useChangesStore } from '../../state/changesStore'
import { useProjectsStore } from '../../state/projectsStore'
import { PanelHeader } from '../../ui/PanelHeader'
import { BranchCard } from './BranchCard'
import { ChangeGroup } from './ChangeGroup'
import { CommitBox } from './CommitBox'
import './changes.css'

export function ChangesPanel() {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const status = useChangesStore((state) => state.status)
  const errorMessage = useChangesStore((state) => state.errorMessage)
  const load = useChangesStore((state) => state.load)

  useEffect(() => {
    if (activeProjectPath !== null) {
      void load(activeProjectPath)
    }
  }, [activeProjectPath, load])

  if (activeProjectPath === null) {
    return (
      <div className="panel-content">
        <PanelHeader title="Changes" />
        <p className="panel-empty">Open a folder in Projects first.</p>
      </div>
    )
  }

  if (status === null) {
    return (
      <div className="panel-content">
        <PanelHeader title="Changes" />
        <p className="panel-empty">{errorMessage ?? 'This folder is not a git repository.'}</p>
      </div>
    )
  }

  const stagedChanges = status.changes.filter((change) => change.isStaged)
  const unstagedChanges = status.changes.filter((change) => !change.isStaged)

  return (
    <div className="panel-content">
      <PanelHeader title="Changes">
        <span className="muted">{status.changes.length} files</span>
      </PanelHeader>
      <BranchCard status={status} repoPath={activeProjectPath} />
      <CommitBox repoPath={activeProjectPath} stagedCount={stagedChanges.length} />
      <ChangeGroup title="Staged" changes={stagedChanges} repoPath={activeProjectPath} />
      <ChangeGroup title="Unstaged" changes={unstagedChanges} repoPath={activeProjectPath} />
      {status.changes.length === 0 && <p className="panel-empty">Working tree is clean.</p>}
    </div>
  )
}
