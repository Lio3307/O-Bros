import { describe, expect, it } from 'vitest'
import {
  binaryCommandName,
  buildAgentSuggestions,
  candidateCommands,
  packageCommandName,
  parseAcpRegistry
} from './acpRegistry'

describe('packageCommandName', () => {
  it('drops the scope and the version', () => {
    expect(packageCommandName('@google/gemini-cli@0.64.0')).toBe('gemini-cli')
    expect(packageCommandName('cline@3.0.71')).toBe('cline')
    expect(packageCommandName('@github/copilot')).toBe('copilot')
  })
})

describe('binaryCommandName', () => {
  it('uses the file name without folders or extension', () => {
    expect(binaryCommandName('./dist-package/cursor-agent')).toBe('cursor-agent')
    expect(binaryCommandName('amp-acp.exe')).toBe('amp-acp')
    expect(binaryCommandName('./goose')).toBe('goose')
    expect(binaryCommandName('goose-package\\goose.exe')).toBe('goose')
  })

  it('ignores version pins written with ==', () => {
    expect(packageCommandName('fast-agent-acp==0.10.1')).toBe('fast-agent-acp')
  })

  it('does not turn very generic package names into commands', () => {
    expect(candidateCommands('kilo', { npx: { package: '@kilocode/cli@7.8.8' } })).not.toContain('cli')
    expect(candidateCommands('minimax-code', { npx: { package: '@minimax-ai/code@0.2.7' } })).not.toContain('code')
  })
})

describe('candidateCommands', () => {
  it('uses the known command when the registry id differs from it', () => {
    expect(candidateCommands('cursor', { binary: { 'linux-x86_64': { cmd: './cursor-agent' } } })).toEqual([
      'cursor-agent'
    ])
  })

  it('collects names from the id and the launch method, without duplicates', () => {
    const commands = candidateCommands('gemini', { npx: { package: '@google/gemini-cli@0.64.0', args: ['--acp'] } })
    expect(commands).toContain('gemini')
    expect(commands).toContain('gemini-cli')
    expect(new Set(commands).size).toBe(commands.length)
  })
})

describe('parseAcpRegistry', () => {
  it('reads agents and skips broken entries', () => {
    const agents = parseAcpRegistry({
      agents: [{ id: 'opencode', name: 'OpenCode', distribution: { binary: { x: { cmd: './opencode' } } } }, { id: 1 }]
    })
    expect(agents).toEqual([{ id: 'opencode', name: 'OpenCode', commands: ['opencode'] }])
  })

  it('returns nothing for an unexpected document', () => {
    expect(parseAcpRegistry(null)).toEqual([])
    expect(parseAcpRegistry({ agents: 'no' })).toEqual([])
  })
})

describe('buildAgentSuggestions', () => {
  const registry = [{ id: 'gemini', name: 'Gemini CLI', commands: ['gemini', 'gemini-cli'] }]
  const known = [{ name: 'Gemini', command: 'gemini' }, { name: 'Aider', command: 'aider' }]

  it('suggests installed agents and prefers the registry name', () => {
    expect(buildAgentSuggestions(registry, known, ['gemini', 'aider', 'git'], [])).toEqual([
      { name: 'Gemini CLI', command: 'gemini' },
      { name: 'Aider', command: 'aider' }
    ])
  })

  it('skips agents that are already added or not installed', () => {
    expect(buildAgentSuggestions(registry, known, ['gemini'], ['gemini'])).toEqual([])
  })

  it('still works from the built-in list when the registry is unavailable', () => {
    expect(buildAgentSuggestions([], known, ['aider'], [])).toEqual([{ name: 'Aider', command: 'aider' }])
  })
})
