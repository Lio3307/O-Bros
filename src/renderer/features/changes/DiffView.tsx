import { FileDiff } from 'lucide-react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { useEffect, useState } from 'react'
import type { GitDiffRequest, GitFileChange } from '../../../shared/types'
import { useChangesStore, type CommitFileSelection } from '../../state/changesStore'
import { useProjectsStore } from '../../state/projectsStore'
import { classifyDiffLine } from './diffLines'
import { LineCounts } from './LineCounts'
import { Send } from 'lucide-react'
import { Button } from '../../ui/Button'
import { sendDiffToAgent } from '../prompts/sendToAgent'
import './changes.css'

const SHORT_HASH_LENGTH = 7

interface DiffTarget {
  path: string
  addedLines: number
  removedLines: number
  stateLabel: string
  request: Omit<GitDiffRequest, 'repoPath'>
}

function targetOfCommitFile(file: CommitFileSelection): DiffTarget {
  return {
    path: file.path,
    addedLines: file.addedLines,
    removedLines: file.removedLines,
    stateLabel: `commit ${file.hash.slice(0, SHORT_HASH_LENGTH)}`,
    request: { filePath: file.path, isStaged: false, isUntracked: false, commitHash: file.hash }
  }
}

function targetOfChange(change: GitFileChange): DiffTarget {
  return {
    path: change.path,
    addedLines: change.addedLines,
    removedLines: change.removedLines,
    stateLabel: change.isStaged ? 'staged' : 'unstaged',
    request: { filePath: change.path, isStaged: change.isStaged, isUntracked: change.kind === 'untracked' }
  }
}

function chooseTarget(change: GitFileChange | null, commitFile: CommitFileSelection | null): DiffTarget | null {
  if (commitFile !== null) {
    return targetOfCommitFile(commitFile)
  }
  return change === null ? null : targetOfChange(change)
}

export function DiffView() {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const selectedChange = useChangesStore((state) => state.selectedChange)
  const selectedCommitFile = useChangesStore((state) => state.selectedCommitFile)
  const [diffText, setDiffText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  const target = chooseTarget(selectedChange, selectedCommitFile)

  useEffect(() => {
    if (activeProjectPath === null || target === null) {
      setDiffText('')
      return
    }
    setErrorMessage(null)
    window.api.git
      .diff({ repoPath: activeProjectPath, ...target.request })
      .then(setDiffText)
      .catch((error: unknown) => setErrorMessage(friendlyErrorMessage(error, 'Could not load this diff.')))
  }, [activeProjectPath, selectedChange, selectedCommitFile])

  if (target === null) {
    return (
      <div className="diff-placeholder">
        <FileDiff size={28} />
        <span className="diff-placeholder-title">No file selected</span>
        <span className="muted">Pick a changed file or a commit file in the list to see what changed.</span>
      </div>
    )
  }

  return (
    <div className="diff">
      <header className="diff-header">
        <span className="diff-path">{target.path}</span>
        <span className="diff-summary">
          <LineCounts addedLines={target.addedLines} removedLines={target.removedLines} />
          <span className="muted">{target.stateLabel} · read-only</span>
          <Button
            variant="outline"
            title="Insert this diff into the focused terminal"
            disabled={diffText.trim() === ''}
            onClick={() => sendDiffToAgent(target.path, diffText)}
          >
            <Send size={14} /> Send to terminal
          </Button>
        </span>
      </header>
      {errorMessage !== null && <div className="diff-message">{errorMessage}</div>}
      {errorMessage === null && diffText.trim() === '' && (
        <div className="diff-message">There is no text to compare for this file.</div>
      )}
      {errorMessage === null && diffText.trim() !== '' && (
        <div className="diff-body">
          {diffText.split('\n').map((line, index) => (
            <div key={index} className={`diff-line diff-line-${classifyDiffLine(line)}`}>
              {line}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
