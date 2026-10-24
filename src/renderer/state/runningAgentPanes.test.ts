import { describe, expect, it } from 'vitest'
import { describeRunningAgents } from './runningAgentPanes'

describe('describeRunningAgents', () => {
  it('names one agent and its team members', () => {
    expect(describeRunningAgents([{ label: 'Codex', memberCount: 2 }])).toBe(
      'Codex is still running. Closing stops it, and a reply it is writing is lost. Its 2 team members stop too. Files already changed stay as they are.'
    )
  })

  it('lists several agents and says nothing when none run', () => {
    expect(describeRunningAgents([{ label: 'Claude Code', memberCount: 0 }, { label: 'Gemini', memberCount: 0 }])).toContain(
      'Claude Code and Gemini are still running. Closing stops them, and a reply they are writing is lost.'
    )
    expect(describeRunningAgents([])).toBe('')
  })
})
