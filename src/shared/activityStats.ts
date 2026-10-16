import type { ActivityEntry, LiveAgent } from './activity'

const HOURS_PER_DAY = 24
const HOUR_MS = 60 * 60 * 1000

export interface DaySummary {
  agentTimeMs: number
  sessionCount: number
  gitAllowed: number
  gitDenied: number
  teamJoined: number
}

export interface AgentTime {
  agentCommand: string
  timeMs: number
  sessionCount: number
}

function startOfDay(now: number): number {
  return new Date(now).setHours(0, 0, 0, 0)
}

function entriesOfToday(entries: ActivityEntry[], now: number): ActivityEntry[] {
  const dayStart = startOfDay(now)
  return entries.filter((entry) => entry.at >= dayStart && entry.at <= now)
}

function liveTimeToday(agent: LiveAgent, now: number): number {
  return Math.max(now - Math.max(agent.startedAt, startOfDay(now)), 0)
}

function isSessionStart(entry: ActivityEntry): boolean {
  return entry.kind === 'session' && entry.durationMs === null
}

function isTeamJoin(entry: ActivityEntry): boolean {
  return entry.kind === 'team' && entry.durationMs === null
}

function finishedTimeOf(entry: ActivityEntry): number {
  return entry.kind === 'git' ? 0 : (entry.durationMs ?? 0)
}

export function summarizeToday(entries: ActivityEntry[], live: LiveAgent[], now: number): DaySummary {
  const today = entriesOfToday(entries, now)
  const closedTime = today.reduce((total, entry) => total + finishedTimeOf(entry), 0)
  const runningTime = live.reduce((total, agent) => total + liveTimeToday(agent, now), 0)
  const gitEntries = today.filter((entry) => entry.kind === 'git')
  return {
    agentTimeMs: closedTime + runningTime,
    sessionCount: today.filter(isSessionStart).length,
    gitAllowed: gitEntries.filter((entry) => entry.outcome === 'allowed').length,
    gitDenied: gitEntries.filter((entry) => entry.outcome === 'denied').length,
    teamJoined: today.filter(isTeamJoin).length
  }
}

export function countByHour(entries: ActivityEntry[], now: number): number[] {
  const counts = Array.from({ length: HOURS_PER_DAY }, () => 0)
  const dayStart = startOfDay(now)
  for (const entry of entriesOfToday(entries, now)) {
    counts[Math.min(Math.floor((entry.at - dayStart) / HOUR_MS), HOURS_PER_DAY - 1)] += 1
  }
  return counts
}

export function timeByAgent(entries: ActivityEntry[], live: LiveAgent[], now: number): AgentTime[] {
  const byAgent = new Map<string, AgentTime>()
  function add(agentCommand: string, timeMs: number, sessions: number): void {
    const key = agentCommand.trim().split(' ')[0].toLowerCase()
    const current = byAgent.get(key) ?? { agentCommand, timeMs: 0, sessionCount: 0 }
    byAgent.set(key, { ...current, timeMs: current.timeMs + timeMs, sessionCount: current.sessionCount + sessions })
  }
  for (const entry of entriesOfToday(entries, now)) {
    if (entry.kind !== 'git' && entry.agentCommand !== null) {
      add(entry.agentCommand, finishedTimeOf(entry), isSessionStart(entry) || isTeamJoin(entry) ? 1 : 0)
    }
  }
  live.forEach((agent) => add(agent.agentCommand, liveTimeToday(agent, now), 0))
  return [...byAgent.values()].filter((agent) => agent.timeMs > 0).sort((first, second) => second.timeMs - first.timeMs)
}
