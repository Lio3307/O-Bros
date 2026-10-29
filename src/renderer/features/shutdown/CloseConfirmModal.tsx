import { Folder } from 'lucide-react'
import { agentLabelOf, isAgentCommand } from '../../../shared/agentLaunchers'
import { lastPathSegment } from '../../../shared/paths'
import { readableList } from '../../../shared/readableList'
import type { RunningTask } from '../../../shared/types'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { isTerminalTab, useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { useCloseRequestStore } from '../../state/closeRequestStore'
import { Button } from '../../ui/Button'
import { Modal } from '../../ui/Modal'
import { TerminalTabIcon } from '../terminal/TerminalTabIcon'
import './closeConfirmModal.css'

const MAX_HELPERS_SHOWN = 3

function TaskRow({ task }: { task: RunningTask }) {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)
  const tab = tabs.filter(isTerminalTab).find((candidate: TerminalTab) => task.paneId in candidate.panes)
  const cwd = tab?.panes[task.paneId].cwd ?? tab?.cwd ?? null
  const folder = cwd === null ? 'Home' : lastPathSegment(cwd)
  const program = task.program === null ? 'A program' : isAgentCommand(task.program, launchers, registry) ? agentLabelOf(task.program, launchers) : task.program

  return (
    <li className="modal-item close-task">
      <span className="close-task-head">
        {tab !== undefined && <TerminalTabIcon tab={tab} />}
        <span className="modal-item-title">{program}</span>
        <span className="close-task-folder" title={cwd ?? undefined}>
          <Folder size={12} />
          {folder}
        </span>
      </span>
      {task.helpers.length > 0 && <span className="muted close-task-detail">Also running {readableList(task.helpers, MAX_HELPERS_SHOWN)}.</span>}
    </li>
  )
}

export function CloseConfirmModal() {
  const pending = useCloseRequestStore((state) => state.pending)
  const isStopping = useCloseRequestStore((state) => state.isStopping)
  const cancel = useCloseRequestStore((state) => state.cancel)
  const confirm = useCloseRequestStore((state) => state.confirm)

  if (pending === null) {
    return null
  }

  const hasTasks = pending.tasks.length > 0
  const hasUnsaved = pending.unsavedFileTitles.length > 0

  return (
    <Modal
      title="Close O-BROS?"
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
              <TaskRow key={task.paneId} task={task} />
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
