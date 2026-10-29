import { describe, expect, it } from 'vitest'
import type { ProcessEntry } from '../resources/processTable'
import { agentAncestorOf, agentProgramOf, isAgentProcess } from './agentCaller'

const PROGRAMS = ['claude', 'codex', 'gemini']

function entry(pid: number, parentPid: number, name: string, commandLine: string): ProcessEntry {
  return { pid, parentPid, name, commandLine, workingSetBytes: 0, privateBytes: 0, cpuTimeMs: null, cpuPercent: null, startedAt: null }
}

describe('isAgentProcess', () => {
  it('recognises native and npm installs of agents', () => {
    expect(isAgentProcess(entry(1, 0, 'claude.exe', 'C:\\Users\\me\\.local\\bin\\claude.exe'), PROGRAMS)).toBe(true)
    expect(isAgentProcess(entry(1, 0, 'node.exe', 'node C:\\npm\\node_modules\\@anthropic-ai\\claude-code\\cli.js'), PROGRAMS)).toBe(true)
    expect(isAgentProcess(entry(1, 0, 'node', 'node /usr/lib/node_modules/@google/gemini-cli/dist/index.js'), PROGRAMS)).toBe(true)
    expect(isAgentProcess(entry(1, 0, 'node.exe', '"C:\\Program Files\\nodejs\\node.exe" tools/claude-code/cli.js'), PROGRAMS)).toBe(true)
  })

  it('does not look at later arguments such as a commit message', () => {
    expect(isAgentProcess(entry(1, 0, 'powershell.exe', 'powershell -Command git commit -m claude'), PROGRAMS)).toBe(false)
    expect(isAgentProcess(entry(1, 0, 'node.exe', 'node server.js --name claude'), PROGRAMS)).toBe(false)
  })
})

describe('agentProgramOf', () => {
  it('names the agent program a process runs', () => {
    expect(agentProgramOf(entry(1, 0, 'node.exe', 'node /usr/lib/node_modules/@google/gemini-cli/dist/index.js'), PROGRAMS)).toBe('gemini')
    expect(agentProgramOf(entry(1, 0, 'node.exe', 'node server.js'), PROGRAMS)).toBeNull()
  })
})

describe('agentAncestorOf', () => {
  const table = [
    entry(10, 1, 'powershell.exe', 'powershell.exe'),
    entry(20, 10, 'claude.exe', 'claude.exe'),
    entry(30, 20, 'bash.exe', 'bash -c "git commit -m x"'),
    entry(40, 30, 'electron.exe', 'electron.exe git-guard.cjs commit -m x'),
    entry(50, 10, 'electron.exe', 'electron.exe git-guard.cjs commit -m claude')
  ]

  it('finds the agent that started the git command', () => {
    expect(agentAncestorOf(table, 40, 10, PROGRAMS)?.pid).toBe(20)
  })

  it('finds nothing when the user typed git in the shell', () => {
    expect(agentAncestorOf(table, 50, 10, PROGRAMS)).toBeNull()
  })

  it('does not climb to a newer process that got the number of a parent that ended', () => {
    const reused = [{ ...entry(20, 1, 'claude.exe', 'claude.exe'), startedAt: 500 }, { ...entry(40, 20, 'electron.exe', 'electron.exe git-guard.cjs commit'), startedAt: 100 }]
    expect(agentAncestorOf(reused, 40, null, PROGRAMS)).toBeNull()
  })
})
