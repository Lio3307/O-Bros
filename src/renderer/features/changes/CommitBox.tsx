import { useState } from 'react'
import { useChangesStore } from '../../state/changesStore'
import { Button } from '../../ui/Button'

export function CommitBox({ repoPath, stagedCount }: { repoPath: string; stagedCount: number }) {
  const isWorking = useChangesStore((state) => state.isWorking)
  const commit = useChangesStore((state) => state.commit)
  const [message, setMessage] = useState('')

  const hasStagedFiles = stagedCount > 0
  const canCommit = hasStagedFiles && message.trim() !== '' && !isWorking

  async function submit(): Promise<void> {
    if (!canCommit) {
      return
    }
    const isDone = await commit(repoPath, message)
    if (isDone) {
      setMessage('')
    }
  }

  return (
    <div className="commit-box">
      <textarea
        className="field commit-message"
        rows={3}
        disabled={!hasStagedFiles}
        title={hasStagedFiles ? 'Ctrl+Enter to commit' : 'Stage a file first'}
        placeholder={hasStagedFiles ? 'Commit message' : 'Stage changes to write a commit message'}
        value={message}
        onChange={(event) => setMessage(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
            void submit()
          }
        }}
      />
      <Button variant="primary" disabled={!canCommit} onClick={() => submit()}>
        {hasStagedFiles ? `Commit ${stagedCount} ${stagedCount === 1 ? 'file' : 'files'}` : 'Nothing staged'}
      </Button>
    </div>
  )
}
