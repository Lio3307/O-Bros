import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { IpcChannel } from '../../../shared/ipc'
import { providerOfCommand, type AgentLauncher } from '../../../shared/agentLaunchers'
import { findTeamAgent, listTeamAgents, type TeamAgentOption } from '../../../shared/teamAgents'
import { TEAM_MEMBER_ID_PREFIX, teamMemberName } from '../../../shared/teamMemberName'
import { autoStopReason, DEFAULT_TEAM_POLICY, isFinishedState, type TeamPolicy } from '../../../shared/teamPolicy'
import { comparablePath } from '../../../shared/paths'
import { taskStartOf } from '../../../shared/teamSessions'
import type { TeamMember } from '../../../shared/types'
import { recordActivity } from '../activity/activityLog'
import { loadAcpRegistry } from '../agents/acpRegistryClient'
import { listPathCommands } from '../agents/agentDetector'
import { killTerminal, writeToTerminal } from '../ptyManager'
import { terminalFactsOf } from '../terminalFacts'
import { isReadyForInput, isSettled, memberStateOf } from './memberState'
import { askInterface, sendToInterface } from './rendererBridge'
import { removeTeamSessionFiles, rememberTeamSession } from './teamSessions'
import { WotError } from './wotError'

const MAX_MEMBERS = 6
const CHAT_DELETE_DELAY_MS = 3000
const MAX_TEXT_LENGTH = 20_000
const POLL_MS = 500
const TERMINAL_START_TIMEOUT_MS = 15_000
const READY_TIMEOUT_MS = 45_000
const SUBMIT_DELAY_MS = 300
const STATE_CHECK_MS = 1000
const DEFAULT_WAIT_SECONDS = 100
const MAX_WAIT_SECONDS = 280
const DEFAULT_READ_LINES = 80
const MAX_READ_LINES = 400
const PASTE_START = '\u001b[200~'
const PASTE_END = '\u001b[201~'

const IS_PATH_CASE_INSENSITIVE = process.platform === 'win32' || process.platform === 'darwin'
const NO_PROJECT_MESSAGE =
  'Team members only work inside a project folder, and this terminal runs in the home folder. Tell the user: open a project folder in O-BROS (the folder button in Projects), then start me from a terminal in that folder.'

export interface SpawnRequest {
  callerPaneId: string
  agent: string
  name: string
  task: string
}

export interface WaitOutcome {
  member: TeamMember
  timedOut: boolean
  waitedSeconds: number
}

const members = new Map<string, TeamMember>()
const finishedSinceById = new Map<string, number>()
let stateTimer: NodeJS.Timeout | null = null
let policy: TeamPolicy = DEFAULT_TEAM_POLICY

export function setTeamPolicy(next: TeamPolicy): void {
  policy = next
}

function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

async function waitUntil(condition: () => boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (condition()) {
      return true
    }
    await delay(POLL_MS)
  }
  return condition()
}

function clamp(value: number | undefined, fallback: number, maximum: number): number {
  if (value === undefined || !Number.isFinite(value) || value <= 0) {
    return fallback
  }
  return Math.min(Math.round(value), maximum)
}

function projectFolderOf(callerPaneId: string): string {
  const cwd = terminalFactsOf(callerPaneId)?.cwd ?? null
  const isHome =
    cwd !== null && comparablePath(cwd, IS_PATH_CASE_INSENSITIVE) === comparablePath(homedir(), IS_PATH_CASE_INSENSITIVE)
  if (cwd === null || isHome) {
    throw new WotError('not-allowed', NO_PROJECT_MESSAGE)
  }
  return cwd
}

export function listMembers(): TeamMember[] {
  return [...members.values()].sort((first, second) => first.createdAt - second.createdAt)
}

function publish(): void {
  sendToInterface(IpcChannel.wotMembers, listMembers())
}

function currentStateOf(member: TeamMember): TeamMember['state'] {
  const facts = terminalFactsOf(member.id)
  return facts === undefined ? 'starting' : memberStateOf(facts, Date.now())
}

function isTerminalOpen(paneId: string): boolean {
  const facts = terminalFactsOf(paneId)
  return facts !== undefined && !facts.hasExited
}

function noteFinishedTime(member: TeamMember, now: number): void {
  if (!isFinishedState(member.state)) {
    finishedSinceById.delete(member.id)
  } else if (!finishedSinceById.has(member.id)) {
    finishedSinceById.set(member.id, now)
  }
}

function recordTeamChange(member: TeamMember, text: string, durationMs: number | null): void {
  void recordActivity({ kind: 'team', agentCommand: member.command, folder: member.cwd, text, detail: null, outcome: null, durationMs })
}

function stopForReason(member: TeamMember, reason: string): void {
  removeMember(member.id, reason)
  sendToInterface(IpcChannel.wotNotice, `Stopped team member "${member.name}" to free memory: ${reason}.`)
}

function refreshStates(): void {
  const now = Date.now()
  let hasChanged = false
  const toStop: { member: TeamMember; reason: string }[] = []
  for (const member of members.values()) {
    const state = currentStateOf(member)
    if (state !== member.state) {
      member.state = state
      hasChanged = true
    }
    noteFinishedTime(member, now)
    const check = {
      state,
      finishedSince: finishedSinceById.get(member.id) ?? null,
      isSummonerOpen: isTerminalOpen(member.summonedByPaneId),
      now
    }
    const reason = autoStopReason(check, policy)
    if (reason !== null) {
      toStop.push({ member, reason })
    }
  }
  toStop.forEach(({ member, reason }) => stopForReason(member, reason))
  if (hasChanged && toStop.length === 0) {
    publish()
  }
}

function keepStatesFresh(): void {
  if (members.size > 0 && stateTimer === null) {
    stateTimer = setInterval(refreshStates, STATE_CHECK_MS)
  }
  if (members.size === 0 && stateTimer !== null) {
    clearInterval(stateTimer)
    stateTimer = null
  }
}

export function isTeamMember(paneId: string): boolean {
  return members.has(paneId)
}

export async function availableAgents(): Promise<TeamAgentOption[]> {
  const [launchers, installedCommands, registryAgents] = await Promise.all([
    askInterface<AgentLauncher[]>({ kind: 'listLaunchers' }),
    listPathCommands(),
    loadAcpRegistry()
  ])
  return listTeamAgents(launchers, registryAgents, installedCommands)
}

function installedNames(options: TeamAgentOption[]): string {
  const names = options.filter((option) => option.isInstalled).map((option) => option.name)
  return names.length === 0 ? 'none' : names.join(', ')
}

async function chooseAgent(query: string): Promise<TeamAgentOption> {
  const options = await availableAgents()
  const match = findTeamAgent(query, options)
  if (match.kind === 'unknown') {
    throw new WotError(
      'unknown-agent',
      `"${query}" is not an agent O-BROS knows. Installed agents you can summon: ${installedNames(options)}.`
    )
  }
  if (match.kind === 'not-installed') {
    throw new WotError(
      'not-installed',
      `${match.agent.name} ("${match.agent.command}") is not installed on this computer. Installed agents you can summon: ${installedNames(options)}.`
    )
  }
  return match.agent
}

export function findMember(nameOrId: string): TeamMember {
  const wanted = nameOrId.trim().toLowerCase()
  const member = [...members.values()].find((candidate) => candidate.id === nameOrId || candidate.name === wanted)
  if (member === undefined) {
    const names = listMembers().map((candidate) => candidate.name)
    const known = names.length === 0 ? 'There are no team members right now.' : `Team members: ${names.join(', ')}.`
    const hint = 'If it finished earlier, O-BROS may have stopped it to free memory; its answer is in its saved conversation.'
    throw new WotError('not-found', `There is no team member named "${nameOrId}". ${known} ${hint}`)
  }
  return member
}

function assertTextLength(text: string): void {
  if (text.length > MAX_TEXT_LENGTH) {
    throw new WotError('bad-request', `The text is too long (${text.length} characters). The limit is ${MAX_TEXT_LENGTH}.`)
  }
}

async function typeAndSubmit(memberId: string, text: string): Promise<void> {
  const withoutReturns = text.split('\r').join('')
  const isBracketedPaste = terminalFactsOf(memberId)?.isBracketedPaste ?? false
  const body = isBracketedPaste ? PASTE_START + withoutReturns + PASTE_END : withoutReturns.split('\n').join(' ')
  writeToTerminal(memberId, body)
  await delay(SUBMIT_DELAY_MS)
  writeToTerminal(memberId, '\r')
}

function removeMember(memberId: string, reason: string | null = null): void {
  const member = members.get(memberId)
  if (member !== undefined) {
    const text = reason === null ? `left the team ("${member.name}")` : `was stopped ("${member.name}"): ${reason}`
    recordTeamChange(member, text, Date.now() - member.createdAt)
  }
  members.delete(memberId)
  finishedSinceById.delete(memberId)
  killTerminal(memberId)
  keepStatesFresh()
  publish()
  if (member !== undefined && policy.deleteChatWhenStopped) {
    setTimeout(() => void removeTeamSessionFiles(memberId, false).catch(() => undefined), CHAT_DELETE_DELAY_MS)
  }
}

function commandWithSessionId(command: string, sessionId: string | null): string {
  return sessionId === null ? command : `${command} --session-id ${sessionId}`
}

export async function spawnMember(request: SpawnRequest): Promise<{ member: TeamMember; taskSent: boolean }> {
  if (isTeamMember(request.callerPaneId)) {
    throw new WotError('not-allowed', 'A team member cannot summon more agents. Only the agent the user talks to can.')
  }
  if (members.size >= MAX_MEMBERS) {
    throw new WotError('limit', `The team is full (${MAX_MEMBERS} members). Stop one with "wot stop <name>" first.`)
  }
  assertTextLength(request.task)
  const cwd = projectFolderOf(request.callerPaneId)
  const agent = await chooseAgent(request.agent)
  const takenNames = listMembers().map((member) => member.name)
  const provider = providerOfCommand(agent.command)
  const sessionId = provider === 'claude' ? randomUUID() : null

  const member: TeamMember = {
    id: `${TEAM_MEMBER_ID_PREFIX}${randomUUID()}`,
    name: teamMemberName(request.name, agent.name, takenNames),
    agentName: agent.name,
    command: commandWithSessionId(agent.command, sessionId),
    cwd,
    summonedByPaneId: request.callerPaneId,
    task: request.task,
    createdAt: Date.now(),
    state: 'starting'
  }
  members.set(member.id, member)
  recordTeamChange(member, `joined the team as "${member.name}"`, null)
  if (provider !== null) {
    void rememberTeamSession({
      memberId: member.id,
      memberName: member.name,
      agentName: agent.name,
      provider,
      sessionId,
      cwd,
      startedAt: member.createdAt,
      taskStart: taskStartOf(request.task)
    })
  }
  keepStatesFresh()
  publish()

  const hasStarted = await waitUntil(() => terminalFactsOf(member.id) !== undefined, TERMINAL_START_TIMEOUT_MS)
  if (!hasStarted) {
    removeMember(member.id)
    throw new WotError('failed', 'The O-BROS window did not start the terminal for this agent. Is the window open?')
  }
  if (request.task.trim() === '') {
    return { member, taskSent: false }
  }

  await waitUntil(() => {
    const facts = terminalFactsOf(member.id)
    return facts === undefined || facts.hasExited || isReadyForInput(facts, Date.now())
  }, READY_TIMEOUT_MS)
  if (terminalFactsOf(member.id)?.hasExited ?? true) {
    throw new WotError('failed', `"${member.name}" stopped right after it started. Run "wot read ${member.name}" to see why.`)
  }
  await typeAndSubmit(member.id, request.task)
  return { member, taskSent: true }
}

export async function sendToMember(nameOrId: string, text: string): Promise<TeamMember> {
  const member = findMember(nameOrId)
  assertTextLength(text)
  if (text.trim() === '') {
    throw new WotError('bad-request', 'There is no text to send.')
  }
  if (terminalFactsOf(member.id)?.hasExited ?? true) {
    throw new WotError('failed', `"${member.name}" is not running anymore. Stop it with "wot stop ${member.name}".`)
  }
  await typeAndSubmit(member.id, text)
  return member
}

export async function readMemberScreen(nameOrId: string, lines: number | undefined): Promise<string> {
  const member = findMember(nameOrId)
  return askInterface<string>({ kind: 'readScreen', memberId: member.id, lines: clamp(lines, DEFAULT_READ_LINES, MAX_READ_LINES) })
}

export async function waitForMember(nameOrId: string, timeoutSeconds: number | undefined): Promise<WaitOutcome> {
  const member = findMember(nameOrId)
  const startedAt = Date.now()
  const timeoutMs = clamp(timeoutSeconds, DEFAULT_WAIT_SECONDS, MAX_WAIT_SECONDS) * 1000
  const isDone = await waitUntil(() => !members.has(member.id) || isSettled(currentStateOf(member)), timeoutMs)
  member.state = currentStateOf(member)
  return { member, timedOut: !isDone, waitedSeconds: Math.round((Date.now() - startedAt) / 1000) }
}

export function stopMember(nameOrId: string): TeamMember {
  const member = findMember(nameOrId)
  removeMember(member.id)
  return member
}

export function stopAllMembers(): number {
  const ids = [...members.keys()]
  ids.forEach((id) => removeMember(id))
  return ids.length
}

export function closeMemberById(memberId: string): void {
  if (members.has(memberId)) {
    removeMember(memberId)
  }
}
