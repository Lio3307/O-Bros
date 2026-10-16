import { shortDetail } from '../../../shared/activity'
import { describeTraces, mentionsAgent } from '../../../shared/agentTraces'
import { identityEnvironment, type CommitIdentity } from '../../../shared/commitIdentity'
import {
  createsCommits,
  gitSubcommand,
  guardedGitAction,
  makesOneNewCommit,
  namesAfterSubcommand,
  withoutAuthorOption
} from '../../../shared/gitGuard'
import type { AgentGitAnswer } from '../../../shared/types'
import { recordActivity } from '../activity/activityLog'
import { writeLog } from '../logging/logFile'
import { freshTypedAgents } from '../activity/typedAgents'
import { terminalFactsOf } from '../terminalFacts'
import { loadAgentCatalog, type AgentCatalog } from './agentCatalog'
import { isAgentCaller } from './agentCaller'
import { findPushTraces } from './pushTraces'
import { askInterface } from './rendererBridge'

const CONFIRM_TIMEOUT_MS = 110_000
const SLOW_PREPARATION_MS = 5000
const BRANCH_ACTIONS = ['create a branch', 'create a worktree']

export interface GitDecision {
  allowed: boolean
  action: string
  reason: string
  arguments: string[]
  environment: Record<string, string>
  identity: CommitIdentity | null
  cleanAfterCommit: boolean
}

export interface GitCall {
  paneId: string
  gitArguments: string[]
  cwd: string
  guardPid: number | null
}

function allowAsIs(call: GitCall, action: string): GitDecision {
  return {
    allowed: true,
    action,
    reason: '',
    arguments: call.gitArguments,
    environment: {},
    identity: null,
    cleanAfterCommit: false
  }
}

function branchNameWarnings(gitArguments: string[], action: string | null, catalog: AgentCatalog): string[] {
  if (action === null || !BRANCH_ACTIONS.includes(action)) {
    return []
  }
  return namesAfterSubcommand(gitArguments)
    .filter((name) => mentionsAgent(name, catalog.hints))
    .map((name) => `The name "${name}" mentions an agent, and branch names show on GitHub.`)
}

async function pushWarnings(call: GitCall, catalog: AgentCatalog): Promise<string[]> {
  const traces = await findPushTraces(call.cwd, call.gitArguments, catalog)
  if (traces.length === 0) {
    return []
  }
  return ['These commits would show an agent on GitHub:', ...describeTraces(traces)]
}

interface ConfirmDetails {
  action: string
  fromAgent: boolean
  isGuarded: boolean
  createsCommit: boolean
  warnings: string[]
}

async function askUser(call: GitCall, details: ConfirmDetails): Promise<AgentGitAnswer> {
  try {
    return await askInterface<AgentGitAnswer>(
      { kind: 'confirmGit', paneId: call.paneId, command: ['git', ...call.gitArguments].join(' '), cwd: call.cwd, ...details },
      CONFIRM_TIMEOUT_MS
    )
  } catch {
    return { allowed: false, reason: 'The user did not answer in time.', identity: null, keepCoAuthors: false }
  }
}

async function recordAgentGit(call: GitCall, action: string, answer: AgentGitAnswer): Promise<void> {
  const typedAgent = (await freshTypedAgents()).get(call.paneId)
  await recordActivity({
    kind: 'git',
    agentCommand: terminalFactsOf(call.paneId)?.agentCommand ?? typedAgent?.program ?? null,
    folder: call.cwd,
    text: `tried to ${action}`,
    detail: shortDetail(['git', ...call.gitArguments].join(' ')),
    outcome: answer.allowed ? 'allowed' : 'denied',
    durationMs: null
  })
}

export async function decideGit(call: GitCall): Promise<GitDecision> {
  const startedAt = Date.now()
  const subcommand = gitSubcommand(call.gitArguments) ?? ''
  const guardedAction = guardedGitAction(call.gitArguments)
  const createsCommit = createsCommits(call.gitArguments)
  const isPush = subcommand === 'push'
  const action = guardedAction ?? subcommand
  if (guardedAction === null && !createsCommit) {
    return allowAsIs(call, action)
  }

  const catalog = await loadAgentCatalog()
  const fromAgent = await isAgentCaller(call.paneId, call.guardPid, catalog)
  const warnings = [
    ...(isPush ? await pushWarnings(call, catalog) : []),
    ...(fromAgent ? branchNameWarnings(call.gitArguments, guardedAction, catalog) : [])
  ]
  if (!fromAgent && warnings.length === 0) {
    return allowAsIs(call, action)
  }

  const preparationMs = Date.now() - startedAt
  if (preparationMs > SLOW_PREPARATION_MS) {
    writeLog('warning', `The git guard needed ${preparationMs} ms before it could ask about "${action}".`)
  }
  const answer = await askUser(call, { action, fromAgent, isGuarded: guardedAction !== null, createsCommit, warnings })
  if (fromAgent) {
    void recordAgentGit(call, action, answer).catch(() => undefined)
  }
  const appliesIdentity = fromAgent && createsCommit
  return {
    allowed: answer.allowed,
    action,
    reason: answer.allowed ? '' : answer.reason || 'The user said no.',
    arguments: fromAgent && subcommand === 'commit' ? withoutAuthorOption(call.gitArguments) : call.gitArguments,
    environment: appliesIdentity ? identityEnvironment(answer.identity) : {},
    identity: appliesIdentity ? answer.identity : null,
    cleanAfterCommit: fromAgent && answer.allowed && makesOneNewCommit(call.gitArguments) && !answer.keepCoAuthors
  }
}
