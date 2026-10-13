import { FileDiff } from 'lucide-react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { useEffect, useState } from 'react'
import { useChangesStore } from '../../state/changesStore'
import { useProjectsStore } from '../../state/projectsStore'
import { classifyDiffLine } from './diffLines'
import './changes.css'

export function DiffView() {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const selectedChange = useChangesStore((state) => state.selectedChange)
  const [diffText, setDiffText] = useState('')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)

  useEffect(() => {
    if (activeProjectPath === null || selectedChange === null) {
      setDiffText('')
      return
    }
    setErrorMessage(null)
    window.api.git
      .diff({
        repoPath: activeProjectPath,
        filePath: selectedChange.path,
        isStaged: selectedChange.isStaged,
        isUntracked: selectedChange.kind === 'untracked'
      })
      .then(setDiffText)
      .catch((error: unknown) => setErrorMessage(friendlyErrorMessage(error, 'Could not load this diff.')))
  }, [activeProjectPath, selectedChange])

  if (selectedChange === null) {
    return (
      <div className="diff-placeholder">
        <FileDiff size={28} />
        <span className="diff-placeholder-title">No file selected</span>
        <span className="muted">Pick a changed file in the list to see what changed.</span>
      </div>
    )
  }

  return (
    <div className="diff">
      <header className="diff-header">
        <span className="diff-path">{selectedChange.path}</span>
        <span className="muted">
          +{selectedChange.addedLines} −{selectedChange.removedLines} ·{' '}
          {selectedChange.isStaged ? 'staged' : 'unstaged'} · read-only
        </span>
      </header>
      <div className="diff-body">
        {errorMessage !== null && <p className="muted">{errorMessage}</p>}
        {diffText.split('\n').map((line, index) => (
          <div key={index} className={`diff-line diff-line-${classifyDiffLine(line)}`}>
            {line}
          </div>
        ))}
      </div>
    </div>
  )
}
