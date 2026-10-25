import { runningAgentsIn } from './runningAgentPanes'
import { useTeamStore } from './teamStore'
import { isTerminalTab, useWorkspaceStore } from './workspaceStore'

export async function isWorkRunning(): Promise<boolean> {
  const panes = useWorkspaceStore.getState().tabs.filter(isTerminalTab).flatMap((tab) => Object.values(tab.panes))
  if (runningAgentsIn(panes).length > 0 || useTeamStore.getState().members.some((member) => member.state !== 'exited')) {
    return true
  }
  const runningTasks = await window.api.app.listRunningTasks().catch(() => [])
  return runningTasks.length > 0
}
