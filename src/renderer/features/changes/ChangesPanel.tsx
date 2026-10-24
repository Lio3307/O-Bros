import { useCallback, useEffect } from 'react'
import { useChangesStore } from '../../state/changesStore'
import { useCommitHistoryStore } from '../../state/commitHistoryStore'
import { closestProject } from '../../../shared/closestProject'
import { comparablePath, isPathInside, lastPathSegment, parentPath } from '../../../shared/paths'
import { useProjectsStore } from '../../state/projectsStore'
import { useIsInMissingProject } from '../../state/missingProject'
import { MISSING_FOLDER_MESSAGE } from '../../../shared/friendlyError'
import { useGitRepositoryPath, useGitRepositoryStore } from '../../state/gitRepositoryStore'
import { LoadingText } from '../../ui/LoadingText'
import { PanelHeader } from '../../ui/PanelHeader'
import { useLiveRefresh } from '../../ui/useLiveRefresh'
import { BranchCard } from './BranchCard'
import { ChangeGroup } from './ChangeGroup'
import { CommitBox } from './CommitBox'
import { CommitHistory } from './CommitHistory'
import { ConflictSection } from './ConflictSection'
import { RepositorySwitcher } from './RepositorySwitcher'
import { refsKeyOf } from './refsKey'
import { ReviewSection } from './ReviewSection'
import { StashSection } from './StashSection'
import { ArrowLeft } from 'lucide-react'
import './changes.css'

export function ChangesPanel() {
  const repoPath = useGitRepositoryPath()
  const isMissing = useIsInMissingProject(repoPath)
  const roots = useProjectsStore((state) => state.roots)
  const originPath = useGitRepositoryStore((state) => state.originPath)
  const openRepository = useGitRepositoryStore((state) => state.open)
  const loadedStatus = useChangesStore((state) => state.status)
  const loadedPath = useChangesStore((state) => state.loadedPath)
  const errorMessage = useChangesStore((state) => state.errorMessage)
  const isLoaded = loadedPath === repoPath
  const status = isLoaded ? loadedStatus : null
  const load = useChangesStore((state) => state.load)
  const refresh = useChangesStore((state) => state.refresh)
  const loadHistory = useCommitHistoryStore((state) => state.load)
  const resetHistory = useCommitHistoryStore((state) => state.reset)

  useEffect(() => {
    resetHistory()
    if (repoPath !== null) {
      void load(repoPath)
    }
  }, [repoPath, load, resetHistory])

  const refsKey = refsKeyOf(status)

  useEffect(() => {
    if (repoPath !== null && refsKey !== null) {
      void loadHistory(repoPath)
    }
  }, [repoPath, refsKey, loadHistory])

  useLiveRefresh(
    useCallback(async () => {
      if (repoPath !== null) {
        await refresh(repoPath)
      }
    }, [repoPath, refresh])
  )

  if (repoPath === null) {
    return (
      <div className="panel-content">
        <PanelHeader title="Changes" />
        <p className="panel-empty">No folder selected. Open one in Projects first.</p>
      </div>
    )
  }

  const folderAbove = parentPath(repoPath)
  const isAtTop = comparablePath(folderAbove, true) === comparablePath(repoPath, true)
  const hasProjectAbove = !isAtTop && closestProject(folderAbove, roots) !== null
  const hasValidOrigin =
    originPath !== null && originPath !== repoPath && isPathInside(repoPath, originPath)
  const backPath = hasValidOrigin ? originPath : hasProjectAbove ? folderAbove : null
  const backName = backPath === null ? '' : lastPathSegment(backPath)

  function goBack(): void {
    if (backPath !== null) {
      openRepository(backPath, null)
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
        <RepositorySwitcher repoPath={repoPath} />
        {backButton}
        <p className="panel-empty">
          {isMissing ? MISSING_FOLDER_MESSAGE : isLoaded ? (errorMessage ?? 'This folder is not a git repository. Pick a repository above or from the list.') : <LoadingText text="Reading the folder…" />}
        </p>
      </div>
    )
  }

  const conflicts = status.changes.filter((change) => change.kind === 'conflicted')
  const stagedChanges = status.changes.filter((change) => change.isStaged)
  const unstagedChanges = status.changes.filter((change) => !change.isStaged && change.kind !== 'conflicted')

  return (
    <div className="panel-content">
      <PanelHeader title="Changes">
        <span className="muted">{status.changes.length === 1 ? '1 file' : `${status.changes.length} files`}</span>
      </PanelHeader>
      <RepositorySwitcher repoPath={repoPath} />
      {backButton}
      <BranchCard status={status} repoPath={repoPath} />
      <ConflictSection repoPath={repoPath} operation={status.operation} conflicts={conflicts} />
      <ReviewSection repoPath={repoPath} />
      <CommitBox repoPath={repoPath} stagedCount={stagedChanges.length} />
      <ChangeGroup title="Staged" changes={stagedChanges} repoPath={repoPath} />
      <ChangeGroup title="Unstaged" changes={unstagedChanges} repoPath={repoPath} />
      {status.changes.length === 0 && <p className="panel-empty">No changes. Your files match the last commit.</p>}
      <StashSection repoPath={repoPath} />
      <CommitHistory repoPath={repoPath} />
    </div>
  )
}
