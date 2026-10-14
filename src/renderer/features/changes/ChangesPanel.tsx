import { useEffect } from 'react'
import { useChangesStore } from '../../state/changesStore'
import { useCommitHistoryStore } from '../../state/commitHistoryStore'
import { closestProject } from '../../../shared/closestProject'
import { isPathInside, parentPath } from '../../../shared/paths'
import { useProjectsStore } from '../../state/projectsStore'
import { useRepositoryOriginStore } from '../../state/repositoryOriginStore'
import { PanelHeader } from '../../ui/PanelHeader'
import { BranchCard } from './BranchCard'
import { ChangeGroup } from './ChangeGroup'
import { CommitBox } from './CommitBox'
import { CommitHistory } from './CommitHistory'
import { RepositoryPicker } from './RepositoryPicker'
import { StashSection } from './StashSection'
import { Button } from '../../ui/Button'
import { ArrowLeft } from 'lucide-react'
import './changes.css'

export function ChangesPanel() {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const roots = useProjectsStore((state) => state.roots)
  const selectProject = useProjectsStore((state) => state.selectProject)
  const originPath = useRepositoryOriginStore((state) => state.originPath)
  const setOrigin = useRepositoryOriginStore((state) => state.setOrigin)
  const status = useChangesStore((state) => state.status)
  const errorMessage = useChangesStore((state) => state.errorMessage)
  const load = useChangesStore((state) => state.load)
  const loadHistory = useCommitHistoryStore((state) => state.load)
  const resetHistory = useCommitHistoryStore((state) => state.reset)

  useEffect(() => {
    resetHistory()
    if (activeProjectPath !== null) {
      void load(activeProjectPath)
    }
  }, [activeProjectPath, load, resetHistory])

  useEffect(() => {
    if (activeProjectPath !== null && status !== null) {
      void loadHistory(activeProjectPath)
    }
  }, [activeProjectPath, status, loadHistory])

  if (activeProjectPath === null) {
    return (
      <div className="panel-content">
        <PanelHeader title="Changes" />
        <p className="panel-empty">Open a folder in Projects first.</p>
      </div>
    )
  }

  const folderAbove = parentPath(activeProjectPath)
  const hasProjectAbove = closestProject(folderAbove, roots) !== null
  const hasValidOrigin =
    originPath !== null && originPath !== activeProjectPath && isPathInside(activeProjectPath, originPath)
  const backPath = hasValidOrigin ? originPath : hasProjectAbove ? folderAbove : null
  const backName = backPath === null ? '' : (closestProject(backPath, roots)?.name ?? backPath)

  function goBack(): void {
    if (backPath !== null) {
      setOrigin(null)
      selectProject(backPath)
    }
  }

  const backButton = backPath === null ? null : (
    <Button variant="link" onClick={goBack}>
      <ArrowLeft size={14} /> {backName}
    </Button>
  )

  if (status === null) {
    return (
      <div className="panel-content">
        <PanelHeader title="Changes" />
        {backButton}
        <p className="panel-empty">{errorMessage ?? 'This folder is not a git repository.'}</p>
        <RepositoryPicker folderPath={activeProjectPath} />
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
      {backButton}
      <BranchCard status={status} repoPath={activeProjectPath} />
      <CommitBox repoPath={activeProjectPath} stagedCount={stagedChanges.length} />
      <ChangeGroup title="Staged" changes={stagedChanges} repoPath={activeProjectPath} />
      <ChangeGroup title="Unstaged" changes={unstagedChanges} repoPath={activeProjectPath} />
      {status.changes.length === 0 && <p className="panel-empty">Working tree is clean.</p>}
      <StashSection repoPath={activeProjectPath} />
      <CommitHistory repoPath={activeProjectPath} />
    </div>
  )
}
