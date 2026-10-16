import { useEffect, useState } from 'react'
import { programOf } from '../../../shared/agentLaunchers'
import type { TeamAgentOption } from '../../../shared/teamAgents'

export function useInstalledTeamAgents(): TeamAgentOption[] | null {
  const [agents, setAgents] = useState<TeamAgentOption[] | null>(null)

  useEffect(() => {
    let isCurrent = true
    window.api.wot
      .agents()
      .then((options) => isCurrent && setAgents(options.filter((option) => option.isInstalled)))
      .catch(() => isCurrent && setAgents([]))
    return () => {
      isCurrent = false
    }
  }, [])

  return agents
}

export function exampleAgentName(agents: TeamAgentOption[] | null, position: number): string {
  if (agents === null || agents.length === 0) {
    return 'another agent'
  }
  return programOf(agents[position % agents.length].command).toLowerCase()
}
