import { describe, expect, it } from 'vitest'
import { applyRunEvent, headlessAgentOf, newTurnProgress, parseRunLine, turnFailure, type HeadlessAgent, type TurnProgress } from './headlessAgents'

function agentNamed(command: string): HeadlessAgent {
  const agent = headlessAgentOf(command)
  if (agent === null) {
    throw new Error(`${command} has no headless mode`)
  }
  return agent
}

function progressAfter(command: string, lines: object[]): TurnProgress {
  const agent = agentNamed(command)
  return lines
    .flatMap((line) => parseRunLine(agent, JSON.stringify(line)) ?? [])
    .reduce(applyRunEvent, newTurnProgress(null))
}

describe('headlessAgentOf', () => {
  it('knows agents by their program, with or without options', () => {
    expect(headlessAgentOf('claude --model opus')).not.toBeNull()
    expect(headlessAgentOf('Codex')).not.toBeNull()
  })

  it('has nothing for other agents, so they keep the interactive way', () => {
    expect(headlessAgentOf('cline')).toBeNull()
    expect(headlessAgentOf('node "C:\\fake-agent.cjs"')).toBeNull()
  })
})

describe('argumentsFor', () => {
  const turn = { access: 'read' as const, sessionId: null, hasConversation: false }

  it('starts Claude with its own session id, then resumes it', () => {
    const claude = agentNamed('claude')
    expect(claude.argumentsFor({ ...turn, sessionId: 'abc' })).toEqual(expect.arrayContaining(['--session-id', 'abc']))
    expect(claude.argumentsFor({ ...turn, sessionId: 'abc', hasConversation: true })).toEqual(expect.arrayContaining(['--resume', 'abc']))
  })

  it('never lets a read-only member edit', () => {
    expect(agentNamed('claude').argumentsFor(turn)).toEqual(expect.arrayContaining(['dontAsk', '--allowedTools=Read,Grep,Glob']))
    expect(agentNamed('codex').argumentsFor(turn)).toContain('sandbox_mode=read-only')
    expect(agentNamed('gemini').argumentsFor(turn)).toContain('plan')
    expect(agentNamed('opencode').argumentsFor(turn)).toEqual(expect.arrayContaining(['--agent', 'plan']))
  })

  it('resumes Codex and keeps its sandbox on the next turn', () => {
    const args = agentNamed('codex').argumentsFor({ access: 'edit', sessionId: 'thread-1', hasConversation: true })
    expect(args.slice(0, 4)).toEqual(['exec', 'resume', 'thread-1', '-'])
    expect(args).toContain('sandbox_mode=workspace-write')
  })
})

describe('parsing what each agent prints', () => {
  it('reads Claude: the result is the answer, not the text before a tool', () => {
    const progress = progressAfter('claude', [
      { type: 'system', subtype: 'init', session_id: 's-1' },
      { type: 'assistant', message: { content: [{ type: 'text', text: 'Let me look.' }, { type: 'tool_use', name: 'Read' }] } },
      { type: 'result', subtype: 'success', is_error: false, result: 'All good.' }
    ])
    expect(progress).toMatchObject({ sessionId: 's-1', answer: 'All good.', failure: null })
  })

  it('reports a Claude error result, such as a usage limit', () => {
    const progress = progressAfter('claude', [{ type: 'result', is_error: true, result: 'Usage limit reached' }])
    expect(progress.failure).toBe('Usage limit reached')
  })

  it('reads Codex as it really prints, and a settings warning is not a failure', () => {
    const progress = progressAfter('codex', [
      { type: 'thread.started', thread_id: 'thread-1' },
      { type: 'item.completed', item: { id: 'item_0', type: 'error', message: 'Ignoring 4 unrecognized configuration settings.' } },
      { type: 'turn.started' },
      { type: 'item.completed', item: { id: 'item_2', type: 'agent_message', text: 'PONG' } },
      { type: 'turn.completed', usage: { input_tokens: 1 } }
    ])
    expect(progress).toMatchObject({ sessionId: 'thread-1', answer: 'PONG', failure: null })
  })

  it('keeps the last Codex message as the answer', () => {
    const progress = progressAfter('codex', [
      { type: 'item.completed', item: { type: 'agent_message', text: 'Working on it.' } },
      { type: 'item.completed', item: { type: 'command_execution', command: 'git status' } },
      { type: 'item.completed', item: { type: 'agent_message', text: 'Done.' } }
    ])
    expect(progress.answer).toBe('Done.')
  })

  it('joins the pieces of a Gemini message, and starts over after a tool', () => {
    const progress = progressAfter('gemini', [
      { type: 'init', session_id: 'g-1' },
      { type: 'message', role: 'user', content: 'the task' },
      { type: 'message', role: 'assistant', content: 'Looking', delta: true },
      { type: 'tool_use', tool_name: 'read_file' },
      { type: 'message', role: 'assistant', content: 'Do', delta: true },
      { type: 'message', role: 'assistant', content: 'ne', delta: true },
      { type: 'result', status: 'success' }
    ])
    expect(progress).toMatchObject({ sessionId: 'g-1', answer: 'Done' })
  })

  it('remembers an OpenCode error as it really prints, for when the agent exits', () => {
    const progress = progressAfter('opencode', [
      { type: 'step_start', sessionID: 'ses_1', part: { type: 'step-start' } },
      { type: 'error', sessionID: 'ses_1', error: { type: 'provider.transport', message: 'ECONNREFUSED' } }
    ])
    expect(progress.sessionId).toBe('ses_1')
    expect(turnFailure(progress, 1, '')).toBe('ECONNREFUSED')
  })

  it('ignores lines that are not JSON', () => {
    expect(parseRunLine(agentNamed('codex'), 'Reading prompt from stdin...')).toBeNull()
    expect(parseRunLine(agentNamed('codex'), '{broken')).toBeNull()
  })
})

describe('turnFailure', () => {
  const clean = newTurnProgress(null)

  it('is no failure when the agent exits cleanly, even after a retried connection problem', () => {
    expect(turnFailure(applyRunEvent(clean, { kind: 'problem', text: 'Reconnecting 1/5' }), 0, '')).toBeNull()
  })

  it('says why, from what the agent printed', () => {
    expect(turnFailure(clean, 41, 'Please set an Auth method\n')).toBe('Please set an Auth method')
    expect(turnFailure(clean, 1, '')).toBe('The agent stopped with exit code 1.')
  })
})
