import { describeRestartImpact } from '../../shared/restartImpact'
import { askToConfirm } from './confirmStore'
import { useWorkspaceStore } from './workspaceStore'

export async function restartToUpdate(): Promise<void> {
  const runningTasks = await window.api.app.listRunningTasks()
  const unsavedFileCount = useWorkspaceStore
    .getState()
    .tabs.filter((tab) => tab.kind === 'file' && tab.isModified).length

  const impact = describeRestartImpact(runningTasks.length, unsavedFileCount)
  if (impact !== null) {
    const isConfirmed = await askToConfirm({
      title: 'Restart to update?',
      message: impact,
      confirmLabel: 'Restart and install'
    })
    if (!isConfirmed) {
      return
    }
  }
  await window.api.updater.install()
}
