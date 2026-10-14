import { describe, expect, it } from 'vitest'
import {
  agentStatusOf,
  isUsableLauncher,
  parseAgentLaunchers,
  parseShownIds,
  programOf,
  providerOfCommand,
  shownLaunchers,
  toggleShownId,
  type AgentLauncher
} from './agentLaunchers'

const launchers: AgentLauncher[] = [
  { id: 'a', name: 'Claude', command: 'claude' },
  { id: 'b', name: 'Codex', command: 'codex' },
  { id: 'c', name: 'OpenCode', command: 'opencode' },
  { id: 'd', name: '', command: 'blank' }
]

describe('agentStatusOf', () => {
  const installed = ['claude', 'opencode']

  it('is checking until the PATH has been read', () => {
    expect(agentStatusOf('claude', null)).toBe('checking')
  })

  it('is connected when the program is in PATH, ignoring arguments and case', () => {
    expect(agentStatusOf('opencode --fast', installed)).toBe('connected')
    expect(agentStatusOf('Claude', installed)).toBe('connected')
  })

  it('is missing when the program is not in PATH or the command is empty', () => {
    expect(agentStatusOf('aider', installed)).toBe('missing')
    expect(agentStatusOf('   ', installed)).toBe('missing')
  })

  it('tells signed in from signed out for Claude and Codex only', () => {
    expect(agentStatusOf('claude', installed, true)).toBe('signed-in')
    expect(agentStatusOf('claude', installed, false)).toBe('signed-out')
    expect(agentStatusOf('opencode', installed, false)).toBe('connected')
  })

  it('is missing, not signed out, when the program is not installed', () => {
    expect(agentStatusOf('codex', installed, true)).toBe('missing')
  })

  it('cannot check a command given as a file path', () => {
    expect(agentStatusOf('C:\\tools\\agent.exe', installed)).toBe('custom-path')
    expect(agentStatusOf('./agent', installed)).toBe('custom-path')
  })
})

describe('toggleShownId', () => {
  it('adds an agent while there is room', () => {
    expect(toggleShownId(['a'], 'c')).toEqual(['a', 'c'])
  })

  it('refuses a third agent', () => {
    expect(toggleShownId(['a', 'b'], 'c')).toEqual(['a', 'b'])
  })

  it('removes an agent that is already shown', () => {
    expect(toggleShownId(['a', 'b'], 'a')).toEqual(['b'])
  })
})

describe('shownLaunchers', () => {
  it('returns shown agents in the chosen order, skipping unusable ones', () => {
    expect(shownLaunchers(launchers, ['c', 'd', 'a']).map((launcher) => launcher.id)).toEqual(['c', 'a'])
  })

  it('never returns more than two', () => {
    expect(shownLaunchers(launchers, ['a', 'b', 'c'])).toHaveLength(2)
  })
})

describe('parseShownIds', () => {
  it('shows nothing when no choice is saved', () => {
    expect(parseShownIds(null, launchers)).toEqual([])
    expect(parseShownIds('{broken', launchers)).toEqual([])
  })

  it('drops ids of agents that no longer exist', () => {
    expect(parseShownIds(JSON.stringify(['c', 'gone']), launchers)).toEqual(['c'])
  })

  it('keeps an empty choice', () => {
    expect(parseShownIds('[]', launchers)).toEqual([])
  })
})

describe('providerOfCommand', () => {
  it('knows the two providers with accounts, even with arguments', () => {
    expect(providerOfCommand('claude')).toBe('claude')
    expect(providerOfCommand('codex --model gpt')).toBe('codex')
  })

  it('returns null for any other agent', () => {
    expect(providerOfCommand('opencode')).toBeNull()
    expect(providerOfCommand('claudette')).toBeNull()
  })
})

describe('programOf', () => {
  it('takes the first word of a command', () => {
    expect(programOf('  aider --watch ')).toBe('aider')
  })
})

describe('isUsableLauncher', () => {
  it('needs both a name and a command', () => {
    expect(isUsableLauncher('OpenCode', 'opencode')).toBe(true)
    expect(isUsableLauncher('  ', 'opencode')).toBe(false)
    expect(isUsableLauncher('OpenCode', '')).toBe(false)
  })
})

describe('parseAgentLaunchers', () => {
  it('reads a saved list', () => {
    const raw = JSON.stringify([{ id: 'a', name: 'Aider', command: 'aider' }])
    expect(parseAgentLaunchers(raw)).toEqual([{ id: 'a', name: 'Aider', command: 'aider' }])
  })

  it('keeps an empty saved list, so a user can remove every launcher', () => {
    expect(parseAgentLaunchers('[]')).toEqual([])
  })

  it('drops broken entries', () => {
    const raw = JSON.stringify([{ id: 'a', name: 'Aider', command: 'aider' }, { id: 'b' }, 'text', { id: 'c', name: '', command: 'x' }])
    expect(parseAgentLaunchers(raw)).toHaveLength(1)
  })

  it('returns null for missing or invalid storage', () => {
    expect(parseAgentLaunchers(null)).toBeNull()
    expect(parseAgentLaunchers('{not json')).toBeNull()
    expect(parseAgentLaunchers('{}')).toBeNull()
  })
})
