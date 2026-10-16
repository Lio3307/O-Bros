import { describe, expect, it } from 'vitest'
import { expandSkillFolders, parseSkillFolderRules } from './skillFolders'

const RULES = parseSkillFolderRules({
  folders: [
    { id: 'claude', title: 'Claude Code', command: 'claude', path: '{account:claude}/skills' },
    { id: 'shared', title: 'Shared skills folder', command: null, path: '{home}/.agents/skills' },
    { id: 'broken' }
  ]
})

describe('parseSkillFolderRules', () => {
  it('reads valid rules and skips broken ones', () => {
    expect(RULES.map((rule) => rule.id)).toEqual(['claude', 'shared'])
    expect(RULES[1].command).toBeNull()
  })
})

describe('expandSkillFolders', () => {
  it('repeats account rules for every account and fills in the home folder', () => {
    const places = expandSkillFolders(RULES, '/home/me', [
      { provider: 'claude', configDir: '/home/me/.claude', isSystemDefault: true },
      { provider: 'claude', configDir: '/home/me/.claude-work', isSystemDefault: false },
      { provider: 'codex', configDir: '/home/me/.codex', isSystemDefault: true }
    ])
    expect(places).toEqual([
      { id: 'claude:/home/me/.claude', title: 'Claude Code', command: 'claude', skillsFolder: '/home/me/.claude/skills' },
      {
        id: 'claude:/home/me/.claude-work',
        title: 'Claude Code (.claude-work)',
        command: 'claude',
        skillsFolder: '/home/me/.claude-work/skills'
      },
      { id: 'shared', title: 'Shared skills folder', command: null, skillsFolder: '/home/me/.agents/skills' }
    ])
  })
})
