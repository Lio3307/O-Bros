import { describe, expect, it } from 'vitest'
import { outdatedSkillTargets, skillUpdateMessage, skillUpdateNoteForAgents } from './skillUpdates'
import type { WotSkillTarget } from './types'

function target(id: string, status: WotSkillTarget['status'], installedVersion: string | null): WotSkillTarget {
  return { id, title: id, readBy: [], iconCommand: '', skillPath: '', status, installedVersion, availableVersion: '1.3.0' }
}

describe('wot skill updates', () => {
  it('finds only installed skills that are older than the shipped one', () => {
    const targets = [target('Claude Code', 'outdated', '1.2.0'), target('Shared skills folder', 'installed', '1.3.0'), target('Other', 'missing', null)]
    expect(outdatedSkillTargets(targets).map((item) => item.id)).toEqual(['Claude Code'])
    expect(skillUpdateMessage(targets)).toContain('(1.2.0 → 1.3.0) for Claude Code')
    expect(skillUpdateNoteForAgents(targets)).toBe(
      'NOTE: Your wot skill is outdated (1.2.0 → 1.3.0). Tell the user to update it in O-BROS → Settings → Team (wot) and then restart you.'
    )
  })

  it('says nothing when every installed skill is current', () => {
    const targets = [target('Claude Code', 'installed', '1.3.0'), target('Other', 'missing', null)]
    expect(skillUpdateMessage(targets)).toBeNull()
    expect(skillUpdateNoteForAgents(targets)).toBeNull()
  })
})
