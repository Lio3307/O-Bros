import type { TeamMember } from '../../../shared/types'
import { askToConfirm } from '../../state/confirmStore'

export async function stopTeamMember(member: TeamMember): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: `Stop "${member.name}"?`,
    message: `${member.agentName} stops and its terminal closes. Files it already changed stay as they are.`,
    confirmLabel: 'Stop'
  })
  if (isConfirmed) {
    await window.api.wot.closeMember(member.id)
  }
}
