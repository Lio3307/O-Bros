import { describe, expect, it } from 'vitest'
import { agentGitVerdict, readAgentGitPolicy, type AgentGitSituation } from './agentGitPolicy'

const AGENT_COMMIT: AgentGitSituation = { fromAgent: true, changesHistory: true, isTeamMember: false, hasWarnings: false }

describe('agent git policy', () => {
  it('blocks agent commits, pushes and branch changes by default', () => {
    expect(readAgentGitPolicy(null)).toBe('block')
    expect(readAgentGitPolicy('nonsense')).toBe('block')
    expect(agentGitVerdict(AGENT_COMMIT, readAgentGitPolicy(null))).toBe('block')
    expect(agentGitVerdict({ ...AGENT_COMMIT, isTeamMember: true }, 'block')).toBe('block')
  })

  it('never touches what the user runs, but still asks about agent traces before a push', () => {
    expect(agentGitVerdict({ ...AGENT_COMMIT, fromAgent: false }, 'block')).toBe('allow')
    expect(agentGitVerdict({ ...AGENT_COMMIT, fromAgent: false, hasWarnings: true }, 'block')).toBe('ask')
  })

  it('asks or allows when the user chose that, and always asks for team members when allowing', () => {
    expect(agentGitVerdict(AGENT_COMMIT, 'ask')).toBe('ask')
    expect(agentGitVerdict(AGENT_COMMIT, 'allow')).toBe('allow')
    expect(agentGitVerdict({ ...AGENT_COMMIT, isTeamMember: true }, 'allow')).toBe('ask')
  })
})
