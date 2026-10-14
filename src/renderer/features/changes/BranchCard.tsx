import { ArrowDown, ArrowUp, Check, ChevronDown, GitBranch, MoreHorizontal } from 'lucide-react'
import { useCallback, useState, type MouseEvent } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { describeSyncState } from '../../../shared/gitSync'
import { formatAge } from '../../../shared/time'
import type { GitStatus } from '../../../shared/types'
import { useChangesStore } from '../../state/changesStore'
import { useProjectsStore } from '../../state/projectsStore'
import { toast } from '../../state/toastStore'
import { Button } from '../../ui/Button'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { RefreshButton } from '../../ui/RefreshButton'
import { useNow } from '../../ui/useNow'
import {
  amendLastCommitFlow,
  createBranchFlow,
  deleteBranchFlow,
  renameBranchFlow,
  undoLastCommitFlow
} from './branchFlows'
import { syncLabel } from './syncLabel'

const AGE_REFRESH_MS = 30_000

interface OpenMenu {
  x: number
  y: number
  items: PopupMenuItem[]
}

export function BranchCard({ status, repoPath }: { status: GitStatus; repoPath: string }) {
  const isFetching = useChangesStore((state) => state.isFetching)
  const errorMessage = useChangesStore((state) => state.errorMessage)
  const fetchRemote = useChangesStore((state) => state.fetchRemote)
  const switchBranch = useChangesStore((state) => state.switchBranch)
  const pull = useChangesStore((state) => state.pull)
  const push = useChangesStore((state) => state.push)
  const isWorking = useChangesStore((state) => state.isWorking)
  const reloadProjects = useProjectsStore((state) => state.load)
  const now = useNow(AGE_REFRESH_MS)
  const [openMenu, setOpenMenu] = useState<OpenMenu | null>(null)
  const closeMenu = useCallback(() => setOpenMenu(null), [])

  const isUpToDate = describeSyncState(status) === 'up-to-date'
  const fetchedText =
    status.lastFetchedAt === null ? 'Never fetched' : `Fetched ${formatAge(status.lastFetchedAt, now)}`

  async function showBranches(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    const bounds = event.currentTarget.getBoundingClientRect()
    try {
      const { branches, current } = await window.api.git.branches(repoPath)
      setOpenMenu({
        x: bounds.left,
        y: bounds.bottom + 4,
        items: branches.map((branch) => ({
          label: branch,
          isActive: branch === current,
          onSelect: () => {
            if (branch !== current) {
              void switchBranch(repoPath, branch).then((isDone) => isDone && void reloadProjects())
            }
          }
        }))
      })
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not list the branches.'))
    }
  }

  async function showBranchActions(event: MouseEvent<HTMLButtonElement>): Promise<void> {
    const bounds = event.currentTarget.getBoundingClientRect()
    try {
      const { branches, current } = await window.api.git.branches(repoPath)
      const otherBranches = branches.filter((branch) => branch !== current)
      const items: PopupMenuItem[] = [
        { label: 'New branch…', onSelect: () => void createBranchFlow(repoPath) },
        ...(current === null
          ? []
          : [{ label: `Rename "${current}"…`, onSelect: () => void renameBranchFlow(repoPath, current) }]),
        ...otherBranches.map((branch) => ({
          label: `Delete branch "${branch}"…`,
          onSelect: () => void deleteBranchFlow(repoPath, branch)
        })),
        { label: 'Change last commit message…', onSelect: () => void amendLastCommitFlow(repoPath, status) },
        { label: 'Undo last commit', onSelect: () => void undoLastCommitFlow(repoPath, status) }
      ]
      setOpenMenu({ x: bounds.left, y: bounds.bottom + 4, items })
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not list the branches.'))
    }
  }

  return (
    <div className="branch-card">
      <div className="branch-card-name">
        <GitBranch size={14} />
        <button type="button" className="branch-switch" title="Switch branch" onClick={(event) => void showBranches(event)}>
          <span>{status.branch}</span>
          <ChevronDown size={12} />
        </button>
        <span className="chip chip-current">current</span>
        <button
          type="button"
          className="branch-more"
          title="Branch and commit actions"
          onClick={(event) => void showBranchActions(event)}
        >
          <MoreHorizontal size={16} />
        </button>
      </div>
      <div className="branch-card-upstream">
        <span className="muted">tracking</span>
        <span className="mono muted">{status.upstream ?? 'none'}</span>
      </div>
      <div className="branch-card-sync">
        <span className="branch-card-state">
          {isUpToDate && <Check size={14} />}
          {syncLabel(status)}
        </span>
        <span className="branch-card-fetch-group">
          <span className="muted">{fetchedText}</span>
          <RefreshButton
            variant="icon"
            iconSize={12}
            isBusy={isFetching}
            hasFailed={errorMessage !== null}
            title="Fetch from the remote"
            onRefresh={() => void fetchRemote(repoPath)}
          />
        </span>
      </div>
      <div className="branch-card-actions">
        <Button
          variant="outline"
          disabled={isWorking || status.upstream === null}
          title={status.upstream === null ? 'This branch has no upstream to pull from' : `Pull from ${status.upstream} (fast-forward only)`}
          onClick={() => pull(repoPath)}
        >
          <ArrowDown size={14} /> Pull{status.behind > 0 ? ` ${status.behind}` : ''}
        </Button>
        <Button
          variant="outline"
          disabled={isWorking}
          title={status.upstream === null ? 'Publish this branch to the remote' : `Push to ${status.upstream}`}
          onClick={() => push(repoPath)}
        >
          <ArrowUp size={14} /> {status.upstream === null ? 'Publish' : `Push${status.ahead > 0 ? ` ${status.ahead}` : ''}`}
        </Button>
      </div>
      {openMenu !== null && <PopupMenu x={openMenu.x} y={openMenu.y} items={openMenu.items} onClose={closeMenu} />}
    </div>
  )
}
