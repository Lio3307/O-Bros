import { isAgentCommand } from '../../../shared/agentLaunchers'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useAgentStatusStore } from '../../state/agentStatusStore'
import type { TerminalPaneInfo } from '../../state/workspaceStore'
import { AgentStatusIcon } from '../../ui/AgentStatusIcon'
import { useAgentLabel } from '../../ui/useAgentLabel'

export function PaneAgentStatus({ pane }: { pane: TerminalPaneInfo }) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)
  const status = useAgentStatusStore((state) => state.statuses[pane.id] ?? null)
  const agentLabel = useAgentLabel()

  if (pane.agentCommand === null || !isAgentCommand(pane.agentCommand, launchers, registry)) {
    return null
  }
  return (
    <AgentStatusIcon
      command={pane.agentCommand}
      status={status}
      label={agentLabel(pane.agentCommand)}
      size={12}
      isStopped={!pane.isAgentRunning}
    />
  )
}
