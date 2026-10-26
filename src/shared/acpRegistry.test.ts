import { describe, expect, it } from 'vitest'
import {
  binaryCommandName,
  buildAgentSuggestions,
  candidateCommands,
  packageCommandName,
  parseAcpRegistry,
  parseCommandAliases,
  parseExtraAgents,
  withExtraAgents,
  type AcpAgent
} from './acpRegistry'

function agent(id: string, name: string, commands: string[]): AcpAgent {
  return { id, name, description: '', commands, iconUrl: null }
}

describe('packageCommandName', () => {
  it('drops the scope and the version', () => {
    expect(packageCommandName('@google/gemini-cli@0.64.0')).toBe('gemini-cli')
    expect(packageCommandName('cline@3.0.71')).toBe('cline')
    expect(packageCommandName('@github/copilot')).toBe('copilot')
  })

  it('ignores version pins written with ==', () => {
    expect(packageCommandName('fast-agent-acp==0.10.1')).toBe('fast-agent-acp')
  })
})

describe('binaryCommandName', () => {
  it('uses the file name without folders or extension', () => {
    expect(binaryCommandName('./dist-package/cursor-agent')).toBe('cursor-agent')
    expect(binaryCommandName('amp-acp.exe')).toBe('amp-acp')
    expect(binaryCommandName('./goose')).toBe('goose')
    expect(binaryCommandName('goose-package\\goose.exe')).toBe('goose')
  })
})

describe('candidateCommands', () => {
  it('uses the command from the alias data when the registry id differs from it', () => {
    const aliases = { cursor: 'cursor-agent' }
    expect(candidateCommands('cursor', { binary: { 'linux-x86_64': { cmd: './cursor-agent' } } }, aliases)).toEqual([
      'cursor-agent'
    ])
  })

  it('collects names from the id and the launch method, without duplicates', () => {
    const commands = candidateCommands('gemini', { npx: { package: '@google/gemini-cli@0.64.0', args: ['--acp'] } })
    expect(commands).toContain('gemini')
    expect(commands).toContain('gemini-cli')
    expect(new Set(commands).size).toBe(commands.length)
  })

  it('does not turn very generic package names into commands', () => {
    expect(candidateCommands('kilo', { npx: { package: '@kilocode/cli@7.8.8' } })).not.toContain('cli')
    expect(candidateCommands('minimax-code', { npx: { package: '@minimax-ai/code@0.2.7' } })).not.toContain('code')
  })
})

describe('parseCommandAliases', () => {
  it('reads the alias data file and skips broken values', () => {
    expect(parseCommandAliases({ commandByRegistryId: { 'codex-acp': 'codex', bad: 3 } })).toEqual({ 'codex-acp': 'codex' })
    expect(parseCommandAliases(null)).toEqual({})
  })
})

describe('parseAcpRegistry', () => {
  it('reads agents with their description and icon, and skips broken entries', () => {
    const agents = parseAcpRegistry({
      agents: [
        {
          id: 'opencode',
          name: 'OpenCode',
          description: 'Open source agent',
          icon: 'https://cdn.agentclientprotocol.com/registry/v1/latest/opencode.svg',
          distribution: { binary: { x: { cmd: './opencode' } } }
        },
        { id: 1 }
      ]
    })
    expect(agents).toEqual([
      {
        id: 'opencode',
        name: 'OpenCode',
        description: 'Open source agent',
        commands: ['opencode'],
        iconUrl: 'https://cdn.agentclientprotocol.com/registry/v1/latest/opencode.svg'
      }
    ])
  })

  it('returns nothing for an unexpected document', () => {
    expect(parseAcpRegistry(null)).toEqual([])
    expect(parseAcpRegistry({ agents: 'no' })).toEqual([])
  })
})

describe('buildAgentSuggestions', () => {
  const registry = [agent('gemini', 'Gemini CLI', ['gemini', 'gemini-cli']), agent('nova', 'Nova Agent', ['nova'])]

  it('suggests installed agents from the registry', () => {
    expect(buildAgentSuggestions(registry, ['gemini', 'nova', 'git'], [])).toEqual([
      { name: 'Gemini CLI', command: 'gemini' },
      { name: 'Nova Agent', command: 'nova' }
    ])
  })

  it('skips agents that are already added or not installed', () => {
    expect(buildAgentSuggestions(registry, ['gemini'], ['gemini'])).toEqual([])
  })
})

describe('extra agents outside the registry', () => {
  it('reads the built-in list and adds only agents the registry does not cover', () => {
    const extras = parseExtraAgents({
      extraAgents: [{ name: 'Freebuff', command: 'freebuff' }, { name: 'Gemini again', command: 'gemini' }, { name: 'Broken' }, { name: 'Blank', command: ' ' }]
    })
    expect(extras.map((entry) => entry.commands)).toEqual([['freebuff'], ['gemini']])
    const merged = withExtraAgents([agent('gemini', 'Gemini CLI', ['gemini'])], extras)
    expect(merged.map((entry) => entry.name)).toEqual(['Gemini CLI', 'Freebuff'])
    expect(buildAgentSuggestions(merged, ['freebuff'], [])).toEqual([{ name: 'Freebuff', command: 'freebuff' }])
    expect(parseExtraAgents(null)).toEqual([])
  })
})
