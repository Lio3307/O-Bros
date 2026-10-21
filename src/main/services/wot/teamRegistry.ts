import { randomUUID } from 'node:crypto'
import { homedir } from 'node:os'
import { IpcChannel } from '../../../shared/ipc'
import { providerOfCommand, type AgentLauncher } from '../../../shared/agentLaunchers'
import { findTeamAgent, listTeamAgents, type TeamAgentOption } from '../../../shared/teamAgents'
import { TEAM_MEMBER_ID_PREFIX, teamMemberName } from '../../../shared/teamMemberName'
import { autoStopReason, DEFAULT_TEAM_POLICY, isFinishedState, type TeamPolicy } from '../../../shared/teamPolicy'
import { comparablePath, isDriveRoot, resolvePath } from '../../../shared/paths'
import { commandWithSessionId } from '../../../shared/sessionCommand'
import { commandWithArguments, shellKindOf } from '../../../shared/shellCommand'
import { assertInsideProjectRoots } from '../../pathGuard'
import { taskStartOf } from '../../../shared/teamSessions'
import type { TeamMember } from '../../../shared/types'
import { recordActivity } from '../activity/activityLog'
import { loadAcpRegistry } from '../agents/acpRegistryClient'
import { listPathCommands } from '../agents/agentDetector'
import { killTerminal } from '../ptyManager'
import { terminalFactsOf } from '../terminalFacts'
import { isReadyForInput, isSettled, memberStateOf } from './memberState'
import { typeAndSubmit, waitUntil } from '../terminalTyping'
import { askInterface, sendToInterface } from './rendererBridge'
import { removeTeamSessionFiles, rememberTeamSession } from './teamSessions'
import { WotError } from './wotError'
import { IS_PATH_CASE_INSENSITIVE, isFolder } from '../fileSystem'

const MAX_MEMBERS = 6
const CHAT_DELETE_DELAY_MS = 3000
const MAX_TEXT_LENGTH = 20_000
const TERMINAL_START_TIMEOUT_MS = 15_000
const READY_TIMEOUT_MS = 45_000
const STATE_CHECK_MS = 1000
const DEFAULT_WAIT_SECONDS = 100
const MAX_WAIT_SECONDS = 280
const DEFAULT_READ_LINES = 80
const MAX_READ_LINES = 400

const NO_PROJECT_MESSAGE =
  'Team members only work inside a project folder, and this terminal runs in the home folder. Tell the user: open a project folder in O-BROS (the folder button in Projects), then start me from a terminal in that folder.'

export interface SpawnRequest {
  callerPaneId: string
  agent: string
  name: string
  task: string
  agentArgs: string[]
  cwd: string
}

export interface AnyWaitOutcome {
  member: TeamMember | null
  nothingNew: boolean
  timedOut: boolean
  waitedSeconds: number
  members: TeamMember[]
}

export interface SpawnOutcome {
  member: TeamMember
  taskSent: boolean
  warnings: string[]
}

const EXIT_SCREEN_LINES = 15

export interface WaitOutcome {
  member: TeamMember
  timedOut: boolean
  waitedSeconds: number
}

const members = new Map<string, TeamMember>()
const unreportedIds = new Set<string>()
const finishedSinceById = new Map<string, number>()
let stateTimer: NodeJS.Timeout | null = null
let policy: TeamPolicy = DEFAULT_TEAM_POLICY

export function setTeamPolicy(next: TeamPolicy): void {
  policy = next
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

async function memberFolderOf(callerPaneId: string, requestedFolder: string): Promise<string> {
  const callerFolder = projectFolderOf(callerPaneId)
  if (requestedFolder.trim() === '') {
    return callerFolder
  }
  const folder = resolvePath(callerFolder, requestedFolder.trim())
  try {
    await assertInsideProjectRoots(folder)
  } catch {
    throw new WotError('not-allowed', `"${folder}" is outside the user's project folders. Pick a folder inside the project for --cwd.`)
  }
  if (!(await isFolder(folder))) {
    throw new WotError('bad-request', `"${folder}" is not a folder. Pass an existing folder to --cwd.`)
  }
  return folder
}

function folderWarnings(folder: string): string[] {
  if (!isDriveRoot(folder)) {
    return []
  }
  return [
    `The member works in "${folder}", the top of a drive. Some agents cannot run commands or write files there: Codex's Windows sandbox fails to start in a drive root. If the member reports that its shell or file writes fail, stop it and summon it again with --cwd <a folder inside ${folder}>.`
  ]
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

function updateState(member: TeamMember, state: TeamMember['state']): boolean {
  if (state === member.state) {
    return false
  }
  if (isSettled(state) && !isSettled(member.state)) {
    unreportedIds.add(member.id)
  }
  if (!isSettled(state)) {
    unreportedIds.delete(member.id)
  }
  member.state = state
  return true
}

function refreshStates(): void {
  const now = Date.now()
  let hasChanged = false
  const toStop: { member: TeamMember; reason: string }[] = []
  for (const member of members.values()) {
    const state = currentStateOf(member)
    if (updateState(member, state)) {
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

function removeMember(memberId: string, reason: string | null = null): void {
  const member = members.get(memberId)
  if (member !== undefined) {
    const text = reason === null ? `left the team ("${member.name}")` : `was stopped ("${member.name}"): ${reason}`
    recordTeamChange(member, text, Date.now() - member.createdAt)
  }
  members.delete(memberId)
  unreportedIds.delete(memberId)
  finishedSinceById.delete(memberId)
  killTerminal(memberId)
  keepStatesFresh()
  publish()
  if (member !== undefined && policy.deleteChatWhenStopped) {
    setTimeout(() => void removeTeamSessionFiles(memberId, false).catch(() => undefined), CHAT_DELETE_DELAY_MS)
  }
}

async function lastScreenOf(member: TeamMember): Promise<string> {
  try {
    return await askInterface<string>({ kind: 'readScreen', memberId: member.id, lines: EXIT_SCREEN_LINES })
  } catch {
    return '(the screen could not be read)'
  }
}

async function failBecauseExited(member: TeamMember): Promise<never> {
  updateState(member, 'exited')
  unreportedIds.delete(member.id)
  publish()
  const screen = await lastScreenOf(member)
  throw new WotError(
    'failed',
    `"${member.name}" exited right after it started, so no task was sent. Its last output:\n${screen}\nFix the cause (for example pass agent options after --), then stop it with "wot stop ${member.name}" and summon it again.`
  )
}

export async function spawnMember(request: SpawnRequest): Promise<SpawnOutcome> {
  if (isTeamMember(request.callerPaneId)) {
    throw new WotError('not-allowed', 'A team member cannot summon more agents. Only the agent the user talks to can.')
  }
  if (members.size >= MAX_MEMBERS) {
    throw new WotError('limit', `The team is full (${MAX_MEMBERS} members). Stop one with "wot stop <name>" first.`)
  }
  assertTextLength(request.task)
  const cwd = await memberFolderOf(request.callerPaneId, request.cwd)
  const agent = await chooseAgent(request.agent)
  const takenNames = listMembers().map((member) => member.name)
  const provider = providerOfCommand(agent.command)
  const sessionId = provider === 'claude' ? randomUUID() : null
  const warnings = folderWarnings(cwd)

  const member: TeamMember = {
    id: `${TEAM_MEMBER_ID_PREFIX}${randomUUID()}`,
    name: teamMemberName(request.name, agent.name, takenNames),
    agentName: agent.name,
    command: commandWithArguments(commandWithSessionId(agent.command, sessionId), request.agentArgs, shellKindOf(process.platform)),
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
  await waitUntil(() => {
    const facts = terminalFactsOf(member.id)
    return facts === undefined || facts.hasExited || isReadyForInput(facts, Date.now())
  }, READY_TIMEOUT_MS)
  if (terminalFactsOf(member.id)?.hasExited ?? true) {
    return failBecauseExited(member)
  }
  if (request.task.trim() === '') {
    return { member, taskSent: false, warnings }
  }
  await typeAndSubmit(member.id, request.task)
  return { member, taskSent: true, warnings }
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
  if (isSettled(member.state)) {
    unreportedIds.delete(member.id)
  }
  return askInterface<string>({ kind: 'readScreen', memberId: member.id, lines: clamp(lines, DEFAULT_READ_LINES, MAX_READ_LINES) })
}

export async function waitForMember(nameOrId: string, timeoutSeconds: number | undefined): Promise<WaitOutcome> {
  const member = findMember(nameOrId)
  const startedAt = Date.now()
  const timeoutMs = clamp(timeoutSeconds, DEFAULT_WAIT_SECONDS, MAX_WAIT_SECONDS) * 1000
  const isDone = await waitUntil(() => !members.has(member.id) || isSettled(currentStateOf(member)), timeoutMs)
  updateState(member, currentStateOf(member))
  if (isDone) {
    unreportedIds.delete(member.id)
  }
  return { member, timedOut: !isDone, waitedSeconds: Math.round((Date.now() - startedAt) / 1000) }
}

function membersSummonedBy(callerPaneId: string): TeamMember[] {
  const own = listMembers().filter((member) => member.summonedByPaneId === callerPaneId)
  const hasChanged = own.map((member) => updateState(member, currentStateOf(member))).some((changed) => changed)
  if (hasChanged) {
    publish()
  }
  return own
}

function newlySettledMember(callerPaneId: string): TeamMember | undefined {
  return membersSummonedBy(callerPaneId).find((member) => unreportedIds.has(member.id) && isSettled(member.state))
}

export async function waitForAnyMember(callerPaneId: string, timeoutSeconds: number | undefined): Promise<AnyWaitOutcome> {
  const own = membersSummonedBy(callerPaneId)
  if (own.length === 0) {
    throw new WotError('not-found', 'You have no team members right now. Summon one with "wot spawn" first.')
  }
  const startedAt = Date.now()
  const waitedSeconds = (): number => Math.round((Date.now() - startedAt) / 1000)
  const isNothingNew = newlySettledMember(callerPaneId) === undefined && own.every((member) => isSettled(member.state))
  if (isNothingNew) {
    return { member: null, nothingNew: true, timedOut: false, waitedSeconds: 0, members: own }
  }
  const timeoutMs = clamp(timeoutSeconds, DEFAULT_WAIT_SECONDS, MAX_WAIT_SECONDS) * 1000
  await waitUntil(() => newlySettledMember(callerPaneId) !== undefined, timeoutMs)
  const member = newlySettledMember(callerPaneId) ?? null
  if (member !== null) {
    unreportedIds.delete(member.id)
  }
  return { member, nothingNew: false, timedOut: member === null, waitedSeconds: waitedSeconds(), members: membersSummonedBy(callerPaneId) }
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
