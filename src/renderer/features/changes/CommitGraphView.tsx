import { useEffect, useMemo } from 'react'
import { formatAge } from '../../../shared/time'
import { useCommitGraphStore, canShowMoreGraphCommits } from '../../state/commitGraphStore'
import { useCommitHistoryStore } from '../../state/commitHistoryStore'
import { useProjectsStore } from '../../state/projectsStore'
import { Button } from '../../ui/Button'
import { useNow } from '../../ui/useNow'
import { buildCommitGraph, laneCount } from './commitGraph'
import { CommitFiles } from './CommitFiles'
import { CommitGraphCell } from './CommitGraphCell'
import { CommitRefs } from './CommitRefs'

const AGE_REFRESH_MS = 60_000
const ROW_HEIGHT = 36
const ALL_BRANCHES_VALUE = '\u0000all'
const DOT_Y = ROW_HEIGHT / 2

export function CommitGraphView() {
  const repoPath = useProjectsStore((state) => state.activeProjectPath)
  const commits = useCommitGraphStore((state) => state.commits)
  const limit = useCommitGraphStore((state) => state.limit)
  const isLoading = useCommitGraphStore((state) => state.isLoading)
  const branchFilter = useCommitGraphStore((state) => state.branchFilter)
  const branches = useCommitGraphStore((state) => state.branches)
  const currentBranch = useCommitGraphStore((state) => state.currentBranch)
  const loadBranches = useCommitGraphStore((state) => state.loadBranches)
  const load = useCommitGraphStore((state) => state.load)
  const showMore = useCommitGraphStore((state) => state.showMore)
  const setBranchFilter = useCommitGraphStore((state) => state.setBranchFilter)
  const expandedHash = useCommitHistoryStore((state) => state.expandedHash)
  const toggle = useCommitHistoryStore((state) => state.toggle)
  const now = useNow(AGE_REFRESH_MS)

  const rows = useMemo(() => buildCommitGraph(commits ?? []), [commits])
  const laneTotal = laneCount(rows)

  useEffect(() => {
    if (repoPath !== null) {
      void loadBranches(repoPath).then(() => load(repoPath))
    }
  }, [repoPath, load, loadBranches])

  if (repoPath === null) {
    return <div className="graph-empty">Open a folder in Projects first.</div>
  }

  return (
    <div className="graph-view">
      <header className="graph-toolbar">
        <span className="graph-title">Commit graph</span>
        <label className="graph-option">
          Branch
          <select
            className="field graph-branch-select"
            value={branchFilter ?? ALL_BRANCHES_VALUE}
            onChange={(event) =>
              void setBranchFilter(repoPath, event.target.value === ALL_BRANCHES_VALUE ? null : event.target.value)
            }
          >
            <option value={ALL_BRANCHES_VALUE}>All branches</option>
            {branches.map((branch) => (
              <option key={branch} value={branch}>
                {branch === currentBranch ? `${branch} (current)` : branch}
              </option>
            ))}
          </select>
        </label>
      </header>
      <div className="graph-body">
        {commits === null && <div className="graph-empty">{isLoading ? 'Loading…' : ''}</div>}
        {commits?.length === 0 && <div className="graph-empty">No commits yet.</div>}
        {commits?.map((commit, index) => {
          const isExpanded = expandedHash === commit.hash
          return (
            <div key={commit.hash} className="graph-item">
              <CommitGraphCell row={rows[index]} laneTotal={laneTotal} dotY={DOT_Y} />
              <div className="graph-content">
                <button
                  type="button"
                  className={isExpanded ? 'graph-row graph-row-open' : 'graph-row'}
                  style={{ height: ROW_HEIGHT }}
                  onClick={() => toggle(repoPath, commit.hash)}
                >
                  <span className="graph-subject">{commit.subject}</span>
                  <CommitRefs refs={commit.refs} limit={4} />
                  <span className="graph-author">{commit.author}</span>
                  <span className="graph-hash mono">{commit.shortHash}</span>
                  <span className="graph-age">{formatAge(commit.authoredAt, now)}</span>
                </button>
                {isExpanded && (
                  <div className="graph-files">
                    <CommitFiles commit={commit} />
                  </div>
                )}
              </div>
            </div>
          )
        })}
        {commits !== null && canShowMoreGraphCommits(commits.length, limit) && (
          <div className="graph-more">
            <Button variant="outline" onClick={() => showMore(repoPath)}>
              Show more commits
            </Button>
          </div>
        )}
      </div>
    </div>
  )
}
