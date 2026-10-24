import { Terminal } from 'lucide-react'
import { isAgentCommand } from '../../../shared/agentLaunchers'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import type { TerminalPaneInfo, TerminalTab } from '../../state/workspaceStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { cn } from '../../ui/cn'
import { useAgentLabel } from '../../ui/useAgentLabel'

function agentPaneOf(tab: TerminalTab, isAgent: (command: string | null) => boolean): TerminalPaneInfo | null {
  const focused = tab.panes[tab.focusedPaneId]
  const panes = focused === undefined ? Object.values(tab.panes) : [focused, ...Object.values(tab.panes)]
  const agentPanes = panes.filter((pane) => isAgent(pane.agentCommand))
  return agentPanes.find((pane) => pane.isAgentRunning) ?? agentPanes[0] ?? null
}

export function TerminalTabIcon({ tab, size = 14 }: { tab: TerminalTab; size?: number }) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)
  const agentLabel = useAgentLabel()
  const pane = agentPaneOf(tab, (command) => isAgentCommand(command, launchers, registry))

  if (pane === null || pane.agentCommand === null) {
    return <Terminal size={size} />
  }
  const label = agentLabel(pane.agentCommand)
  return (
    <span
      className={cn('tab-agent-icon', !pane.isAgentRunning && 'tab-agent-icon-stopped')}
      title={pane.isAgentRunning ? `${label} is running here` : `${label} is not running here any more`}
    >
      <AgentIcon command={pane.agentCommand} size={size} />
    </span>
  )
}
