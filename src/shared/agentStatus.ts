import type { TeamMemberState } from './types'
import { looksLikeStillWorking, looksLikeWaitingForInput } from './waitingPrompt'

export type AgentStatus = 'starting' | 'working' | 'asking' | 'done' | 'ready'

export const STARTING_MS = 5000
export const ASKING_AFTER_QUIET_MS = 1500
export const DONE_AFTER_QUIET_MS = 4000
export const ECHO_MS = 400
export const WORK_RUN_MS = 8000
export const SAME_RUN_GAP_MS = 3000

const ENTER = '\r'

export interface AgentActivity {
  startedAt: number
  lastOutputAt: number | null
  runStartedAt: number | null
  lastKeyAt: number | null
  lastResizeAt: number | null
  lastSubmitAt: number | null
  hasWorked: boolean
  answeredLines: string[]
}

export function newAgentActivity(now: number): AgentActivity {
  return {
    startedAt: now,
    lastOutputAt: null,
    runStartedAt: null,
    lastKeyAt: null,
    lastResizeAt: null,
    lastSubmitAt: null,
    hasWorked: false,
    answeredLines: []
  }
}

export function isSubmit(data: string): boolean {
  return data.includes(ENTER)
}

function isRecent(at: number | null, now: number): boolean {
  return at !== null && now - at < ECHO_MS
}

function questionLinesOf(screen: string): string[] {
  return screen.split('\n').filter((line) => looksLikeWaitingForInput(line))
}

export function withOutput(activity: AgentActivity, now: number): AgentActivity {
  if (isRecent(activity.lastKeyAt, now) || isRecent(activity.lastResizeAt, now)) {
    return activity
  }
  const isSameRun = activity.lastOutputAt !== null && now - activity.lastOutputAt <= SAME_RUN_GAP_MS
  const runStartedAt = isSameRun && activity.runStartedAt !== null ? activity.runStartedAt : now
  const isLongRunAfterStart = now - runStartedAt >= WORK_RUN_MS && runStartedAt - activity.startedAt >= STARTING_MS
  return { ...activity, lastOutputAt: now, runStartedAt, hasWorked: activity.hasWorked || isLongRunAfterStart }
}

export function withTyping(activity: AgentActivity, data: string, screen: string, now: number): AgentActivity {
  const submitted = isSubmit(data)
  return {
    ...activity,
    lastKeyAt: submitted ? null : now,
    lastSubmitAt: submitted ? now : activity.lastSubmitAt,
    hasWorked: activity.hasWorked || submitted,
    answeredLines: submitted ? questionLinesOf(screen) : activity.answeredLines
  }
}

export function withResize(activity: AgentActivity, now: number): AgentActivity {
  return { ...activity, lastResizeAt: now }
}

function unansweredQuestions(screen: string, answeredLines: string[]): string[] {
  const remaining = [...answeredLines]
  return questionLinesOf(screen).filter((line) => {
    const index = remaining.findIndex((answered) => line.startsWith(answered))
    if (index === -1) {
      return true
    }
    remaining.splice(index, 1)
    return false
  })
}

export function withScreen(activity: AgentActivity, screen: string): AgentActivity {
  const lines = screen.split('\n')
  const answeredLines = activity.answeredLines.filter((answered) => lines.some((line) => line.startsWith(answered)))
  return answeredLines.length === activity.answeredLines.length ? activity : { ...activity, answeredLines }
}

export function agentStatusOf(activity: AgentActivity, screen: string, now: number): AgentStatus {
  if (now - activity.startedAt < STARTING_MS && activity.lastSubmitAt === null) {
    return 'starting'
  }
  const quietMs = now - Math.max(activity.lastOutputAt ?? activity.startedAt, activity.lastSubmitAt ?? 0)
  if (quietMs < ASKING_AFTER_QUIET_MS) {
    return 'working'
  }
  if (unansweredQuestions(screen, activity.answeredLines).length > 0) {
    return 'asking'
  }
  if (quietMs < DONE_AFTER_QUIET_MS || looksLikeStillWorking(screen)) {
    return 'working'
  }
  return activity.hasWorked ? 'done' : 'ready'
}

const STATUS_OF_MEMBER: Record<TeamMemberState, AgentStatus | null> = {
  starting: 'starting',
  working: 'working',
  waiting: 'asking',
  idle: 'done',
  exited: null
}

export function agentStatusOfMember(state: TeamMemberState): AgentStatus | null {
  return STATUS_OF_MEMBER[state]
}
