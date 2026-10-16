import type { TeamMember } from '../../../shared/types'
import { findTerminalPane } from '../../state/focusTerminalPane'

export interface TeamLead {
  paneId: string
  title: string
  command: string | null
  isOpen: boolean
}

export interface TeamGroup {
  lead: TeamLead
  members: TeamMember[]
}

export function leadOf(member: TeamMember): TeamLead {
  const pane = findTerminalPane(member.summonedByPaneId)
  return {
    paneId: member.summonedByPaneId,
    title: pane?.title ?? 'A closed terminal',
    command: pane?.startCommand ?? null,
    isOpen: pane !== null
  }
}

export function summonerTitleOf(member: TeamMember): string {
  return leadOf(member).title
}

export function groupByLead(members: TeamMember[]): TeamGroup[] {
  const groups: TeamGroup[] = []
  for (const member of members) {
    const group = groups.find((candidate) => candidate.lead.paneId === member.summonedByPaneId)
    if (group === undefined) {
      groups.push({ lead: leadOf(member), members: [member] })
    } else {
      group.members.push(member)
    }
  }
  return groups
}

export function firstLineOf(text: string): string {
  const firstLine = text.trim().split('\n')[0] ?? ''
  return firstLine === '' ? 'No task yet' : firstLine
}
