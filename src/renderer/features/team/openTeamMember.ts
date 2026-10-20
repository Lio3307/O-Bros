import type { TeamMember } from '../../../shared/types'
import { focusTerminalPane } from '../../state/focusTerminalPane'
import { useLayoutStore } from '../../state/layoutStore'
import { memberToOpenFirst, useTeamStore } from '../../state/teamStore'

export function openTeamMember(member: TeamMember): void {
  focusTerminalPane(member.summonedByPaneId)
  useLayoutStore.getState().openSection('projects')
  useTeamStore.getState().showMember(member.id)
}

export function openFirstTeamMember(): boolean {
  const member = memberToOpenFirst(useTeamStore.getState().members)
  if (member === null) {
    return false
  }
  openTeamMember(member)
  return true
}
