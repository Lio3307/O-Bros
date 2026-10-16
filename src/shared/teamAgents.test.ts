import { describe, expect, it } from 'vitest'
import type { AcpAgent } from './acpRegistry'
import { findTeamAgent, listTeamAgents } from './teamAgents'
import { teamMemberName } from './teamMemberName'

const LAUNCHERS = [{ id: '1', name: 'Claude', command: 'claude --model opus' }]

function registryAgent(id: string, name: string, commands: string[]): AcpAgent {
  return { id, name, description: '', commands, iconUrl: null }
}

const REGISTRY: AcpAgent[] = [
  registryAgent('claude-acp', 'Claude Agent', ['claude']),
  registryAgent('codex-acp', 'Codex CLI', ['codex']),
  registryAgent('gemini', 'Gemini CLI', ['gemini']),
  registryAgent('opencode', 'OpenCode', ['opencode', 'opencode-ai'])
]

describe('listTeamAgents', () => {
  it('puts saved agents first and takes the rest from the ACP registry', () => {
    const options = listTeamAgents(LAUNCHERS, REGISTRY, ['claude', 'codex', 'opencode-ai'])
    expect(options.map((option) => option.name)).toEqual(['Claude', 'Codex CLI', 'Gemini CLI', 'OpenCode'])
    expect(options.find((option) => option.name === 'OpenCode')).toEqual({
      name: 'OpenCode',
      command: 'opencode-ai',
      isInstalled: true
    })
    expect(options.find((option) => option.name === 'Gemini CLI')?.isInstalled).toBe(false)
  })

  it('lists only saved agents when the registry is empty', () => {
    expect(listTeamAgents(LAUNCHERS, [], ['claude']).map((option) => option.name)).toEqual(['Claude'])
  })
})

describe('findTeamAgent', () => {
  const options = listTeamAgents(LAUNCHERS, REGISTRY, ['claude', 'codex'])

  it('finds an agent by name, short name or program, ignoring case', () => {
    expect(findTeamAgent('Codex', options)).toEqual({
      kind: 'found',
      agent: { name: 'Codex CLI', command: 'codex', isInstalled: true }
    })
    expect(findTeamAgent('claude', options).kind).toBe('found')
  })

  it('reports a known agent that is not installed', () => {
    expect(findTeamAgent('gemini', options).kind).toBe('not-installed')
  })

  it('reports an agent nobody knows', () => {
    expect(findTeamAgent('superbot', options).kind).toBe('unknown')
  })
})

describe('teamMemberName', () => {
  it('cleans the requested name', () => {
    expect(teamMemberName('  Code Reviewer!! ', 'Codex', [])).toBe('code-reviewer')
  })

  it('falls back to the agent name', () => {
    expect(teamMemberName('', 'Codex', [])).toBe('codex')
  })

  it('adds a number when the name is taken', () => {
    expect(teamMemberName('codex', 'Codex', ['codex', 'codex-2'])).toBe('codex-3')
  })
})
