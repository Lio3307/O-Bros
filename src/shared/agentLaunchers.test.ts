import { describe, expect, it } from 'vitest'
import {
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
