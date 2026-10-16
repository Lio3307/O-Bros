import { Terminal } from 'lucide-react'
import { isAgentCommand } from '../../../shared/agentLaunchers'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import type { TerminalTab } from '../../state/workspaceStore'
import { AgentIcon } from '../../ui/AgentIcon'

function agentCommandOf(tab: TerminalTab): string | null {
  const firstPane = Object.values(tab.panes)[0]
  return firstPane?.startCommand ?? null
}

export function TerminalTabIcon({ tab, size = 14 }: { tab: TerminalTab; size?: number }) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)
  const command = agentCommandOf(tab)

  if (command !== null && isAgentCommand(command, launchers, registry)) {
    return <AgentIcon command={command} size={size} />
  }
  return <Terminal size={size} />
}
