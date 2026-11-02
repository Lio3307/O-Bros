import { agentLabelOf } from '../../shared/agentLaunchers'
import { useAgentCatalogStore } from '../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../state/agentLaunchersStore'

export function useAgentLabel(): (command: string | null) => string {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const registry = useAgentCatalogStore((state) => state.registry)
  return (command) => (command === null ? 'An agent' : agentLabelOf(command, launchers, registry))
}
