import { Network } from 'lucide-react'
import { formatAge } from '../../../shared/time'
import { useChangesStore } from '../../state/changesStore'
import { canShowMoreCommits, useCommitHistoryStore } from '../../state/commitHistoryStore'
import { Button } from '../../ui/Button'
import { useNow } from '../../ui/useNow'
import { CommitFiles } from './CommitFiles'
import { CommitRefs } from './CommitRefs'

const AGE_REFRESH_MS = 60_000

interface CommitHistoryProps {
  repoPath: string
}

export function CommitHistory({ repoPath }: CommitHistoryProps) {
  const commits = useCommitHistoryStore((state) => state.commits)
  const limit = useCommitHistoryStore((state) => state.limit)
  const expandedHash = useCommitHistoryStore((state) => state.expandedHash)
  const toggle = useCommitHistoryStore((state) => state.toggle)
  const showMore = useCommitHistoryStore((state) => state.showMore)
  const setView = useChangesStore((state) => state.setView)
  const now = useNow(AGE_REFRESH_MS)

  if (commits === null) {
    return null
  }

  return (
    <section>
      <div className="change-group-header">
        <h3 className="section-label change-group-title">History</h3>
        <Button variant="link" title="Show the branch graph in the main area" onClick={() => setView('graph')}>
          <Network size={14} /> Graph
        </Button>
      </div>
      {commits.length === 0 && <p className="panel-empty">No commits yet.</p>}
      {commits.map((commit) => {
        const isExpanded = expandedHash === commit.hash
        return (
          <div key={commit.hash} className="commit-item">
            <div className="commit-body">
              <button
                type="button"
                className={isExpanded ? 'commit-row commit-row-open' : 'commit-row'}
                title={`${commit.subject}\n${commit.shortHash} · ${commit.author}`}
                onClick={() => toggle(repoPath, commit.hash)}
              >
                <span className="commit-subject">{commit.subject}</span>
                <span className="commit-meta">
                  <span className="mono">{commit.shortHash}</span> · {commit.author} · {formatAge(commit.authoredAt, now)}
                </span>
                <CommitRefs refs={commit.refs} />
              </button>
              {isExpanded && <CommitFiles commit={commit} />}
            </div>
          </div>
        )
      })}
      {canShowMoreCommits(commits.length, limit) && (
        <Button variant="link" onClick={() => showMore(repoPath)}>
          Show more commits
        </Button>
      )}
    </section>
  )
}
