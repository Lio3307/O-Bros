import { useEffect } from 'react'
import { useChangesStore } from '../../state/changesStore'
import { useCommitHistoryStore } from '../../state/commitHistoryStore'
import { closestProject } from '../../../shared/closestProject'
import { comparablePath, isPathInside, lastPathSegment, parentPath } from '../../../shared/paths'
import { useProjectsStore } from '../../state/projectsStore'
import { useRepositoryOriginStore } from '../../state/repositoryOriginStore'
import { LoadingText } from '../../ui/LoadingText'
import { PanelHeader } from '../../ui/PanelHeader'
import { BranchCard } from './BranchCard'
import { ChangeGroup } from './ChangeGroup'
import { CommitBox } from './CommitBox'
import { CommitHistory } from './CommitHistory'
import { ReviewSection } from './ReviewSection'
import { StashSection } from './StashSection'
import { ArrowLeft } from 'lucide-react'
import './changes.css'

export function ChangesPanel() {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const roots = useProjectsStore((state) => state.roots)
  const selectProject = useProjectsStore((state) => state.selectProject)
  const originPath = useRepositoryOriginStore((state) => state.originPath)
  const setOrigin = useRepositoryOriginStore((state) => state.setOrigin)
  const loadedStatus = useChangesStore((state) => state.status)
  const loadedPath = useChangesStore((state) => state.loadedPath)
  const errorMessage = useChangesStore((state) => state.errorMessage)
  const isLoaded = loadedPath === activeProjectPath
  const status = isLoaded ? loadedStatus : null
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
        <p className="panel-empty">No folder selected. Open one in Projects first.</p>
      </div>
    )
  }

  const folderAbove = parentPath(activeProjectPath)
  const isAtTop = comparablePath(folderAbove, true) === comparablePath(activeProjectPath, true)
  const hasProjectAbove = !isAtTop && closestProject(folderAbove, roots) !== null
  const hasValidOrigin =
    originPath !== null && originPath !== activeProjectPath && isPathInside(activeProjectPath, originPath)
  const backPath = hasValidOrigin ? originPath : hasProjectAbove ? folderAbove : null
  const backName = backPath === null ? '' : lastPathSegment(backPath)

  function goBack(): void {
    if (backPath !== null) {
      setOrigin(null)
      selectProject(backPath)
    }
  }

  const backButton = backPath === null ? null : (
    <button type="button" className="changes-back" title={`Back to ${backPath}`} onClick={goBack}>
      <ArrowLeft size={14} />
      <span className="changes-back-name">{backName}</span>
    </button>
  )

  if (status === null) {
    return (
      <div className="panel-content">
        <PanelHeader title="Changes" />
        {backButton}
        <p className="panel-empty">
          {isLoaded ? (errorMessage ?? 'This folder is not a git repository.') : <LoadingText text="Reading the folder…" />}
        </p>
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
      <ReviewSection repoPath={activeProjectPath} />
      <CommitBox repoPath={activeProjectPath} stagedCount={stagedChanges.length} />
      <ChangeGroup title="Staged" changes={stagedChanges} repoPath={activeProjectPath} />
      <ChangeGroup title="Unstaged" changes={unstagedChanges} repoPath={activeProjectPath} />
      {status.changes.length === 0 && <p className="panel-empty">No changes. Your files match the last commit.</p>}
      <StashSection repoPath={activeProjectPath} />
      <CommitHistory repoPath={activeProjectPath} />
    </div>
  )
}
