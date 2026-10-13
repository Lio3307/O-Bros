import { useEffect } from 'react'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { useCloseRequestStore } from '../../state/closeRequestStore'
import '../../ui/modal.css'

function useTerminalNames(): (paneId: string) => string {
  const tabs = useWorkspaceStore((state) => state.tabs)

  return (paneId) => {
    for (const tab of tabs.filter(isTerminalTab)) {
      const pane = tab.panes[paneId]
      if (pane !== undefined) {
        return pane.title === tab.title ? tab.title : `${tab.title} / ${pane.title}`
      }
    }
    return 'Terminal'
  }
}

export function CloseConfirmModal() {
  const pending = useCloseRequestStore((state) => state.pending)
  const isStopping = useCloseRequestStore((state) => state.isStopping)
  const cancel = useCloseRequestStore((state) => state.cancel)
  const confirm = useCloseRequestStore((state) => state.confirm)
  const terminalName = useTerminalNames()

  useEffect(() => {
    function cancelOnEscape(event: KeyboardEvent): void {
      if (event.key === 'Escape' && !isStopping) {
        cancel()
      }
    }
    window.addEventListener('keydown', cancelOnEscape)
    return () => window.removeEventListener('keydown', cancelOnEscape)
  }, [cancel, isStopping])

  if (pending === null) {
    return null
  }

  const hasTasks = pending.tasks.length > 0
  const hasUnsaved = pending.unsavedFileTitles.length > 0

  return (
    <div className="modal-backdrop">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="close-modal-title">
        <h2 id="close-modal-title" className="modal-title">
          Close o-bros?
        </h2>
        <p className="muted">
          {hasTasks
            ? 'Closing stops everything that is still running below.'
            : 'You have changes that are not saved.'}
        </p>

        {hasTasks && (
          <div className="modal-section">
            <h3 className="section-label modal-label">Still running</h3>
            <ul className="modal-list">
              {pending.tasks.map((task) => (
                <li key={task.paneId} className="modal-item">
                  <span className="modal-item-title">{terminalName(task.paneId)}</span>
                  {task.commands.map((command) => (
                    <span key={command} className="modal-command mono">
                      {command}
                    </span>
                  ))}
                </li>
              ))}
            </ul>
          </div>
        )}

        {hasUnsaved && (
          <div className="modal-section">
            <h3 className="section-label modal-label">Unsaved changes</h3>
            <ul className="modal-list">
              {pending.unsavedFileTitles.map((title) => (
                <li key={title} className="modal-item">
                  <span className="modal-item-title">{title}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="modal-actions">
          <button type="button" className="button-outline" autoFocus disabled={isStopping} onClick={cancel}>
            Cancel
          </button>
          <button type="button" className="button-primary" disabled={isStopping} onClick={() => void confirm()}>
            {isStopping ? 'Stopping...' : hasTasks ? 'Stop everything and close' : 'Close without saving'}
          </button>
        </div>
      </div>
    </div>
  )
}
