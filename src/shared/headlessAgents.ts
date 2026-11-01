import { programOf } from './agentLaunchers'
import { isRecord } from './isRecord'

export type MemberAccess = 'read' | 'edit'

export type RunEvent =
  | { kind: 'session'; id: string }
  | { kind: 'text'; text: string; isDelta: boolean }
  | { kind: 'final'; text: string }
  | { kind: 'activity'; label: string }
  | { kind: 'problem'; text: string }
  | { kind: 'failed'; text: string }

export interface TurnRequest {
  access: MemberAccess
  sessionId: string | null
  hasConversation: boolean
}

export interface HeadlessAgent {
  choosesOwnSessionId: boolean
  argumentsFor: (turn: TurnRequest) => string[]
  eventsOf: (line: Record<string, unknown>) => RunEvent[]
}

type JsonRecord = Record<string, unknown>

function textOf(value: unknown): string | null {
  return typeof value === 'string' && value !== '' ? value : null
}

function recordOf(value: unknown): JsonRecord {
  return isRecord(value) ? value : {}
}

function messageOf(value: unknown): string {
  const record = recordOf(value)
  return textOf(value) ?? textOf(record.message) ?? textOf(recordOf(record.data).message) ?? 'The agent reported an error.'
}

function claudeEvents(line: JsonRecord): RunEvent[] {
  if (line.type === 'system' && line.subtype === 'init') {
    const id = textOf(line.session_id)
    return id === null ? [] : [{ kind: 'session', id }]
  }
  if (line.type === 'assistant') {
    const content = recordOf(line.message).content
    return (Array.isArray(content) ? content : []).map(recordOf).flatMap((part): RunEvent[] => {
      const text = textOf(part.text)
      if (part.type === 'text' && text !== null) {
        return [{ kind: 'text', text, isDelta: false }]
      }
      const tool = textOf(part.name)
      return part.type === 'tool_use' && tool !== null ? [{ kind: 'activity', label: tool }] : []
    })
  }
  if (line.type !== 'result') {
    return []
  }
  const result = textOf(line.result)
  if (line.is_error === true) {
    return [{ kind: 'failed', text: result ?? messageOf(Array.isArray(line.errors) ? line.errors[0] : null) }]
  }
  return result === null ? [] : [{ kind: 'final', text: result }]
}

function codexEvents(line: JsonRecord): RunEvent[] {
  if (line.type === 'thread.started') {
    const id = textOf(line.thread_id)
    return id === null ? [] : [{ kind: 'session', id }]
  }
  if (line.type === 'turn.failed') {
    return [{ kind: 'failed', text: messageOf(line.error) }]
  }
  if (line.type === 'error') {
    return [{ kind: 'problem', text: messageOf(line.message) }]
  }
  if (line.type !== 'item.completed') {
    return []
  }
  const item = recordOf(line.item)
  const text = textOf(item.text)
  if (item.type === 'agent_message' && text !== null) {
    return [{ kind: 'text', text, isDelta: false }]
  }
  if (item.type === 'error') {
    return [{ kind: 'activity', label: `Note: ${messageOf(item.message)}` }]
  }
  const command = textOf(item.command)
  return command === null ? [] : [{ kind: 'activity', label: command }]
}

function geminiEvents(line: JsonRecord): RunEvent[] {
  if (line.type === 'init') {
    const id = textOf(line.session_id)
    return id === null ? [] : [{ kind: 'session', id }]
  }
  const content = textOf(line.content)
  if (line.type === 'message' && line.role === 'assistant' && content !== null) {
    return [{ kind: 'text', text: content, isDelta: line.delta === true }]
  }
  const tool = textOf(line.tool_name)
  if (line.type === 'tool_use' && tool !== null) {
    return [{ kind: 'activity', label: tool }]
  }
  if (line.type === 'error') {
    return [{ kind: 'problem', text: messageOf(line.message) }]
  }
  return line.type === 'result' && line.status === 'error' ? [{ kind: 'failed', text: messageOf(line.error) }] : []
}

function openCodeEvents(line: JsonRecord): RunEvent[] {
  const id = textOf(line.sessionID)
  const session: RunEvent[] = id === null ? [] : [{ kind: 'session', id }]
  const part = recordOf(line.part)
  const text = textOf(part.text)
  if (line.type === 'text' && text !== null) {
    return [...session, { kind: 'text', text, isDelta: false }]
  }
  const tool = textOf(part.tool)
  if (line.type === 'tool_use' && tool !== null) {
    return [...session, { kind: 'activity', label: tool }]
  }
  return line.type === 'error' ? [...session, { kind: 'problem', text: messageOf(line.error) }] : session
}

const CLAUDE_READ_TOOLS = 'Read,Grep,Glob'

const HEADLESS_AGENTS: Record<string, HeadlessAgent> = {
  claude: {
    choosesOwnSessionId: true,
    argumentsFor: ({ access, sessionId, hasConversation }) => [
      '-p',
      '--output-format',
      'stream-json',
      '--verbose',
      ...(sessionId === null ? [] : [hasConversation ? '--resume' : '--session-id', sessionId]),
      ...(access === 'edit' ? ['--permission-mode', 'acceptEdits'] : ['--permission-mode', 'dontAsk', `--allowedTools=${CLAUDE_READ_TOOLS}`])
    ],
    eventsOf: claudeEvents
  },
  codex: {
    choosesOwnSessionId: false,
    argumentsFor: ({ access, sessionId }) => {
      const sandbox = `sandbox_mode=${access === 'edit' ? 'workspace-write' : 'read-only'}`
      const shared = ['--json', '--skip-git-repo-check', '-c', sandbox]
      return sessionId === null ? ['exec', ...shared] : ['exec', 'resume', sessionId, '-', ...shared]
    },
    eventsOf: codexEvents
  },
  gemini: {
    choosesOwnSessionId: false,
    argumentsFor: ({ access, sessionId }) => [
      '-p',
      ' ',
      '-o',
      'stream-json',
      '--approval-mode',
      access === 'edit' ? 'auto_edit' : 'plan',
      ...(sessionId === null ? [] : ['--resume', sessionId])
    ],
    eventsOf: geminiEvents
  },
  opencode: {
    choosesOwnSessionId: false,
    argumentsFor: ({ access, sessionId }) => [
      'run',
      '--standalone',
      '--format',
      'json',
      ...(access === 'edit' ? ['--auto'] : ['--agent', 'plan']),
      ...(sessionId === null ? [] : ['--session', sessionId])
    ],
    eventsOf: openCodeEvents
  }
}

export function headlessAgentOf(command: string): HeadlessAgent | null {
  return HEADLESS_AGENTS[programOf(command).toLowerCase()] ?? null
}

export function parseRunLine(agent: HeadlessAgent, line: string): RunEvent[] | null {
  const trimmed = line.trim()
  if (!trimmed.startsWith('{')) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(trimmed)
    return isRecord(parsed) ? agent.eventsOf(parsed) : null
  } catch {
    return null
  }
}

export interface TurnProgress {
  sessionId: string | null
  answer: string
  lastProblem: string | null
  failure: string | null
  startsNewMessage: boolean
}

export function newTurnProgress(sessionId: string | null): TurnProgress {
  return { sessionId, answer: '', lastProblem: null, failure: null, startsNewMessage: true }
}

export function applyRunEvent(progress: TurnProgress, event: RunEvent): TurnProgress {
  switch (event.kind) {
    case 'session':
      return { ...progress, sessionId: event.id }
    case 'text': {
      const keepsMessage = event.isDelta && !progress.startsNewMessage
      return { ...progress, answer: keepsMessage ? progress.answer + event.text : event.text, startsNewMessage: !event.isDelta }
    }
    case 'final':
      return { ...progress, answer: event.text, startsNewMessage: true }
    case 'activity':
      return { ...progress, startsNewMessage: true }
    case 'problem':
      return { ...progress, lastProblem: event.text }
    case 'failed':
      return { ...progress, failure: event.text }
  }
}

export function turnFailure(progress: TurnProgress, exitCode: number | null, errorOutput: string): string | null {
  if (progress.failure !== null) {
    return progress.failure
  }
  if (exitCode === 0) {
    return null
  }
  const reason = progress.lastProblem ?? (errorOutput.trim() === '' ? null : errorOutput.trim())
  return reason ?? `The agent stopped with exit code ${exitCode ?? 'unknown'}.`
}
