import type { TeamMember } from '../../../shared/types'
import { askToConfirm } from '../../state/confirmStore'

function warningFor(member: TeamMember): string {
  if (member.state === 'working' || member.state === 'starting') {
    return ' It is still working, so its unfinished turn is lost and the lead stops getting answers from it.'
  }
  if (member.state === 'waiting') {
    return ' It is waiting for an answer right now.'
  }
  return ''
}

export async function stopTeamMember(member: TeamMember): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: `Stop team member "${member.name}"?`,
    message: `${member.agentName} stops and its terminal closes.${warningFor(member)} Files it already changed stay as they are, and its conversation stays saved.`,
    confirmLabel: 'Stop member'
  })
  if (isConfirmed) {
    await window.api.wot.closeMember(member.id)
  }
}
