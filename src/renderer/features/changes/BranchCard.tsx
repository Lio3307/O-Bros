import { Check, ChevronDown, GitBranch } from 'lucide-react'
import { useCallback, useState, type MouseEvent } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { describeSyncState } from '../../../shared/gitSync'
import { formatAge } from '../../../shared/time'
import type { GitStatus } from '../../../shared/types'
import { useChangesStore } from '../../state/changesStore'
import { useProjectsStore } from '../../state/projectsStore'
import { toast } from '../../state/toastStore'
import { PopupMenu, type PopupMenuItem } from '../../ui/PopupMenu'
import { RefreshButton } from '../../ui/RefreshButton'
import { useNow } from '../../ui/useNow'
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

  return (
    <div className="branch-card">
      <div className="branch-card-name">
        <GitBranch size={14} />
        <button type="button" className="branch-switch" title="Switch branch" onClick={(event) => void showBranches(event)}>
          <span>{status.branch}</span>
          <ChevronDown size={12} />
        </button>
        <span className="chip chip-current">current</span>
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
      {openMenu !== null && <PopupMenu x={openMenu.x} y={openMenu.y} items={openMenu.items} onClose={closeMenu} />}
    </div>
  )
}
