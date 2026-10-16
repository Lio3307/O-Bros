import type { WotSkillTarget } from './types'

export function outdatedSkillTargets(targets: WotSkillTarget[]): WotSkillTarget[] {
  return targets.filter((target) => target.status === 'outdated')
}

function versionRange(outdated: WotSkillTarget[]): string {
  const installed = [...new Set(outdated.map((target) => target.installedVersion ?? '?'))].join(', ')
  return `${installed} → ${outdated[0].availableVersion}`
}

export function skillUpdateMessage(targets: WotSkillTarget[]): string | null {
  const outdated = outdatedSkillTargets(targets)
  if (outdated.length === 0) {
    return null
  }
  const places = outdated.map((target) => target.title).join(', ')
  return `The wot skill has an update (${versionRange(outdated)}) for ${places}. Agents keep working, but they follow the older instructions until you update.`
}

export function skillUpdateNoteForAgents(targets: WotSkillTarget[]): string | null {
  const outdated = outdatedSkillTargets(targets)
  if (outdated.length === 0) {
    return null
  }
  return `NOTE: Your wot skill is outdated (${versionRange(outdated)}). Tell the user to update it in O-BROS → Settings → Team (wot) and then restart you.`
}
