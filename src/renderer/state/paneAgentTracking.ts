import { agentLabelOf } from '../../shared/agentLaunchers'
import { useAgentCatalogStore } from './agentCatalogStore'
import { useAgentLaunchersStore } from './agentLaunchersStore'
import { useWorkspaceStore } from './workspaceStore'

export function startPaneAgentTracking(): () => void {
  const stopAgentChanges = window.api.pty.onAgentChanged(({ id, agentCommand }) => {
    const label = agentCommand === null ? '' : agentLabelOf(agentCommand, useAgentLaunchersStore.getState().launchers, useAgentCatalogStore.getState().registry)
    useWorkspaceStore.getState().setPaneAgent(id, agentCommand === null ? null : { command: agentCommand, label })
  })
  const stopExits = window.api.pty.onExit(({ id }) => useWorkspaceStore.getState().setPaneAgent(id, null))
  return () => {
    stopAgentChanges()
    stopExits()
  }
}
