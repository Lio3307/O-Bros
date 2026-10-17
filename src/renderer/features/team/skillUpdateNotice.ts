import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { outdatedSkillTargets, skillUpdateMessage } from '../../../shared/skillUpdates'
import type { WotSkillTarget } from '../../../shared/types'
import { useTeamStore } from '../../state/teamStore'
import { toast } from '../../state/toastStore'

async function updateAll(outdated: WotSkillTarget[]): Promise<void> {
  try {
    for (const target of outdated) {
      await window.api.wot.installSkill(target.id)
    }
    toast.success(`The wot skill is now ${outdated[0].availableVersion}. Restart agents that are running so they read it.`)
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not update the wot skill. Try again in Settings → Team (wot).'))
  }
  await useTeamStore.getState().refreshInstalled()
}

let hasOffered = false

export async function offerSkillUpdates(): Promise<void> {
  if (hasOffered) {
    return
  }
  hasOffered = true
  const targets = await window.api.wot.skillTargets().catch((): WotSkillTarget[] => [])
  const message = skillUpdateMessage(targets)
  if (message !== null) {
    toast.info(message, { label: 'Update all', run: () => updateAll(outdatedSkillTargets(targets)) })
  }
}
