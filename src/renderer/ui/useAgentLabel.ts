import { agentLabelOf } from '../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../state/agentLaunchersStore'

export function useAgentLabel(): (command: string | null) => string {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  return (command) => (command === null ? 'An agent' : agentLabelOf(command, launchers))
}
