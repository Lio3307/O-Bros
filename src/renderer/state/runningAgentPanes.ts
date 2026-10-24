import { agentLabelOf, isAgentCommand } from '../../shared/agentLaunchers'
import { useAgentCatalogStore } from './agentCatalogStore'
import { useAgentLaunchersStore } from './agentLaunchersStore'
import { membersOfTab, useTeamStore } from './teamStore'
import type { TerminalPaneInfo } from './workspaceStore'

export interface RunningAgent {
  label: string
  memberCount: number
}

export function runningAgentsIn(panes: TerminalPaneInfo[]): RunningAgent[] {
  const { launchers } = useAgentLaunchersStore.getState()
  const { registry } = useAgentCatalogStore.getState()
  const { members } = useTeamStore.getState()
  return panes.flatMap((pane) =>
    pane.isAgentRunning && pane.agentCommand !== null && isAgentCommand(pane.agentCommand, launchers, registry)
      ? [{ label: agentLabelOf(pane.agentCommand, launchers), memberCount: membersOfTab(members, [pane.id]).length }]
      : []
  )
}

function listNames(names: string[]): string {
  return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names.at(-1)}`
}

export function describeRunningAgents(agents: RunningAgent[]): string {
  if (agents.length === 0) {
    return ''
  }
  const isOne = agents.length === 1
  const memberCount = agents.reduce((total, agent) => total + agent.memberCount, 0)
  const members = memberCount === 0 ? '' : ` ${memberCount === 1 ? 'Its team member stops' : `Its ${memberCount} team members stop`} too.`
  return (
    `${listNames(agents.map((agent) => agent.label))} ${isOne ? 'is' : 'are'} still running. ` +
    `Closing stops ${isOne ? 'it' : 'them'}, and a reply ${isOne ? 'it is' : 'they are'} writing is lost.${members} ` +
    'Files already changed stay as they are.'
  )
}
