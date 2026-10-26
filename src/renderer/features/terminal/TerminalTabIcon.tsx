import { Terminal } from 'lucide-react'
import { isAgentCommand } from '../../../shared/agentLaunchers'
import type { AgentStatus } from '../../../shared/agentStatus'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useAgentStatusStore } from '../../state/agentStatusStore'
import { useAttentionStore } from '../../state/attentionStore'
import type { TerminalPaneInfo, TerminalTab } from '../../state/workspaceStore'
import { AgentStatusIcon } from '../../ui/AgentStatusIcon'
import { useAgentLabel } from '../../ui/useAgentLabel'

const URGENCY: Record<AgentStatus, number> = { asking: 4, working: 3, done: 2, starting: 1, ready: 0 }

function agentPaneOf(
  tab: TerminalTab,
  isAgent: (command: string | null) => boolean,
  statuses: Record<string, AgentStatus>
): TerminalPaneInfo | null {
  const focused = tab.panes[tab.focusedPaneId]
  const panes = focused === undefined ? Object.values(tab.panes) : [focused, ...Object.values(tab.panes)]
  const agentPanes = panes.filter((pane) => isAgent(pane.agentCommand))
  const urgencyOf = (pane: TerminalPaneInfo): number => URGENCY[statuses[pane.id] ?? 'ready']
  const mostUrgent = agentPanes
    .filter((pane) => pane.isAgentRunning)
    .reduce<TerminalPaneInfo | null>((best, pane) => (best === null || urgencyOf(pane) > urgencyOf(best) ? pane : best), null)
  return mostUrgent ?? agentPanes[0] ?? null
}

export function TerminalTabIcon({ tab, size = 14 }: { tab: TerminalTab; size?: number }) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)
  const statuses = useAgentStatusStore((state) => state.statuses)
  const isUnseen = useAttentionStore((state) => state.tabIds.includes(tab.id))
  const agentLabel = useAgentLabel()
  const pane = agentPaneOf(tab, (command) => isAgentCommand(command, launchers, registry), statuses)

  if (pane === null || pane.agentCommand === null) {
    return <Terminal size={size} />
  }
  return (
    <AgentStatusIcon
      command={pane.agentCommand}
      status={statuses[pane.id] ?? null}
      label={agentLabel(pane.agentCommand)}
      size={size}
      isStopped={!pane.isAgentRunning}
      isUnseen={isUnseen}
    />
  )
}
