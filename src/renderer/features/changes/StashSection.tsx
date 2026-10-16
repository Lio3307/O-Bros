import { Archive } from 'lucide-react'
import { useEffect } from 'react'
import { formatAge } from '../../../shared/time'
import { useChangesStore } from '../../state/changesStore'
import { askToConfirm } from '../../state/confirmStore'
import { useStashStore } from '../../state/stashStore'
import { Button } from '../../ui/Button'
import { useNow } from '../../ui/useNow'

const AGE_REFRESH_MS = 60_000

async function dropAfterConfirm(repoPath: string, ref: string, message: string): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: 'Delete this stash?',
    message: `"${message}" is removed and cannot be restored.`,
    confirmLabel: 'Delete'
  })
  if (isConfirmed) {
    await useStashStore.getState().drop(repoPath, ref)
  }
}

export function StashSection({ repoPath }: { repoPath: string }) {
  const stashes = useStashStore((state) => state.stashes)
  const load = useStashStore((state) => state.load)
  const stash = useStashStore((state) => state.stash)
  const apply = useStashStore((state) => state.apply)
  const changeCount = useChangesStore((state) => state.status?.changes.length ?? 0)
  const isWorking = useChangesStore((state) => state.isWorking)
  const now = useNow(AGE_REFRESH_MS)

  useEffect(() => {
    void load(repoPath)
  }, [repoPath, load])

  if (stashes.length === 0 && changeCount === 0) {
    return null
  }

  return (
    <section>
      <div className="change-group-header">
        <h3 className="section-label change-group-title">Stashes</h3>
        <Button
          variant="link"
          disabled={changeCount === 0 || isWorking}
          title="Put the current changes aside and get a clean working tree"
          onClick={() => stash(repoPath, '')}
        >
          <Archive size={14} /> Stash changes
        </Button>
      </div>
      {stashes.length === 0 && <p className="panel-empty">Nothing stashed. Stash puts your changes aside for later.</p>}
      {stashes.map((entry) => (
        <div key={entry.ref} className="stash-item">
          <span className="stash-text">
            <span className="stash-message">{entry.message}</span>
            <span className="commit-meta">{formatAge(entry.createdAt, now)}</span>
          </span>
          <Button variant="link" title="Apply this stash and remove it from the list" onClick={() => apply(repoPath, entry.ref)}>
            Apply
          </Button>
          <Button variant="link" onClick={() => dropAfterConfirm(repoPath, entry.ref, entry.message)}>
            Delete
          </Button>
        </div>
      ))}
    </section>
  )
}
