import type { TeamMember } from '../../../shared/types'
import { findTerminalPane } from '../../state/focusTerminalPane'

export interface TeamLead {
  paneId: string
  title: string
  command: string | null
  isOpen: boolean
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

export function firstLineOf(text: string): string {
  const firstLine = text.trim().split('\n')[0] ?? ''
  return firstLine === '' ? 'No task yet' : firstLine
}
