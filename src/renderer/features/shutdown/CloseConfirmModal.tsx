import { agentLabelOf, isAgentCommand } from '../../../shared/agentLaunchers'
import { readableList } from '../../../shared/readableList'
import type { RunningTask } from '../../../shared/types'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { useCloseRequestStore } from '../../state/closeRequestStore'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'

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

const MAX_HELPERS_SHOWN = 3

function useTaskSummary(): (task: RunningTask) => string {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)

  return (task) => {
    const program = task.program === null ? null : isAgentCommand(task.program, launchers, registry) ? agentLabelOf(task.program, launchers) : task.program
    const helpers = task.helpers.length === 0 ? '' : ` It also started ${readableList(task.helpers, MAX_HELPERS_SHOWN)}.`
    return program === null ? `A program is still running.${helpers}` : `${program} is still running.${helpers}`
  }
}

export function CloseConfirmModal() {
  const pending = useCloseRequestStore((state) => state.pending)
  const isStopping = useCloseRequestStore((state) => state.isStopping)
  const cancel = useCloseRequestStore((state) => state.cancel)
  const confirm = useCloseRequestStore((state) => state.confirm)
  const terminalName = useTerminalNames()
  const taskSummary = useTaskSummary()

  if (pending === null) {
    return null
  }

  const hasTasks = pending.tasks.length > 0
  const hasUnsaved = pending.unsavedFileTitles.length > 0

  return (
    <Modal
      title="Close o-bros?"
      titleId="close-modal-title"
      onEscape={isStopping ? undefined : cancel}
      actions={
        <>
          <Button variant="outline" autoFocus disabled={isStopping} onClick={cancel}>
            Cancel
          </Button>
          <Button variant="primary" disabled={isStopping} onClick={() => confirm()}>
            {isStopping ? 'Stopping...' : hasTasks ? 'Stop everything and close' : 'Close without saving'}
          </Button>
        </>
      }
    >
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
                <span className="muted">{taskSummary(task)}</span>
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
    </Modal>
  )
}
