import { readFile, stat } from 'node:fs/promises'
import { resolve } from 'node:path'
import { shortDetail } from '../../../shared/activity'
import {
  bodyFilePaths,
  guardedHostAction,
  mayCarryAgentCredits,
  withoutAgentCredits,
  type HostTool
} from '../../../shared/hostGuard'
import type { AgentHostAnswer } from '../../../shared/types'
import { recordActivity } from '../activity/activityLog'
import { noteAgentSeen } from '../activity/typedAgents'
import { loadAgentCatalog } from './agentCatalog'
import { findAgentCaller } from './agentCaller'
import { askInterface } from './rendererBridge'

const CONFIRM_TIMEOUT_MS = 110_000
const MAX_BODY_FILE_BYTES = 256 * 1024
const MAX_SHOWN_COMMAND_LENGTH = 600

export interface HostCall {
  paneId: string
  tool: HostTool
  toolArguments: string[]
  cwd: string
  guardPid: number | null
}

export interface HostDecision {
  allowed: boolean
  action: string
  reason: string
  arguments: string[]
}

function shownCommand(call: HostCall): string {
  const command = [call.tool, ...call.toolArguments].join(' ')
  return command.length <= MAX_SHOWN_COMMAND_LENGTH ? command : `${command.slice(0, MAX_SHOWN_COMMAND_LENGTH - 1)}…`
}

async function readBodyFile(cwd: string, path: string): Promise<string | null> {
  const fullPath = resolve(cwd, path)
  const info = await stat(fullPath).catch(() => null)
  if (info === null || !info.isFile() || info.size > MAX_BODY_FILE_BYTES) {
    return null
  }
  return readFile(fullPath, 'utf8').catch(() => null)
}

async function readBodyFiles(call: HostCall): Promise<Map<string, string>> {
  const texts = new Map<string, string>()
  for (const path of bodyFilePaths(call.toolArguments)) {
    const text = await readBodyFile(call.cwd, path)
    if (text !== null) {
      texts.set(path, text)
    }
  }
  return texts
}

async function askUser(call: HostCall, action: string): Promise<AgentHostAnswer> {
  try {
    return await askInterface<AgentHostAnswer>(
      { kind: 'confirmHost', paneId: call.paneId, action, command: shownCommand(call), cwd: call.cwd },
      CONFIRM_TIMEOUT_MS
    )
  } catch {
    return { allowed: false, reason: 'The user did not answer in time.', keepCredits: false }
  }
}

async function recordAgentHost(call: HostCall, action: string, answer: AgentHostAnswer, agentCommand: string | null): Promise<void> {
  await recordActivity({
    kind: 'git',
    agentCommand,
    folder: call.cwd,
    text: `tried to run ${action}`,
    detail: shortDetail([call.tool, ...call.toolArguments].join(' ')),
    outcome: answer.allowed ? 'allowed' : 'denied',
    durationMs: null
  })
}

export async function decideHost(call: HostCall): Promise<HostDecision> {
  const action = guardedHostAction(call.tool, call.toolArguments)
  if (action === null) {
    return { allowed: true, action: call.tool, reason: '', arguments: call.toolArguments }
  }
  const allowAsIs: HostDecision = { allowed: true, action, reason: '', arguments: call.toolArguments }

  const catalog = await loadAgentCatalog()
  const caller = await findAgentCaller(call.paneId, call.guardPid, catalog)
  if (caller === null) {
    return allowAsIs
  }
  if (caller.command !== null) {
    noteAgentSeen(call.paneId, caller.command)
  }
  const answer = await askUser(call, action)
  void recordAgentHost(call, action, answer, caller.command).catch(() => undefined)
  if (!answer.allowed) {
    return { ...allowAsIs, allowed: false, reason: answer.reason || 'The user said no.' }
  }
  if (answer.keepCredits || !mayCarryAgentCredits(call.toolArguments)) {
    return allowAsIs
  }
  return { ...allowAsIs, arguments: withoutAgentCredits(call.toolArguments, catalog.hints, await readBodyFiles(call)) }
}
