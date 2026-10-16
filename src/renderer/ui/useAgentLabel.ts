import { programOf, shortAgentName } from '../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../state/agentLaunchersStore'

export function useAgentLabel(): (command: string | null) => string {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  return (command) => {
    if (command === null) {
      return 'An agent'
    }
    const program = programOf(command).toLowerCase()
    const launcher = launchers.find((candidate) => programOf(candidate.command).toLowerCase() === program)
    return launcher === undefined ? programOf(command) : shortAgentName(launcher.name)
  }
}
