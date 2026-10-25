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
  taskQueued: boolean
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

export function listOwnMembers(callerPaneId: string): TeamMember[] {
  return listMembers().filter((member) => member.summonedByPaneId === callerPaneId)
}

function ownNamesText(callerPaneId: string): string {
  const names = listOwnMembers(callerPaneId).map((member) => member.name)
  return names.length === 0 ? 'You have no team members right now.' : `Your team members: ${names.join(', ')}.`
}

export function findOwnMember(nameOrId: string, callerPaneId: string): TeamMember {
  const member = findMember(nameOrId)
  if (member.summonedByPaneId !== callerPaneId) {
    throw new WotError(
      'not-allowed',
      `"${member.name}" belongs to another terminal's team, so you cannot use it. Leave it alone. ${ownNamesText(callerPaneId)}`
    )
  }
  return member
}

function publish(): void {
  sendToInterface(IpcChannel.wotMembers, listMembers())
}

const startingIds = new Set<string>()
const goneReasons = new Map<string, string>()
const deliveries = new Map<string, Promise<void>>()
const queuedSendCounts = new Map<string, number>()

function isDelivering(memberId: string): boolean {
  return startingIds.has(memberId) || (queuedSendCounts.get(memberId) ?? 0) > 0
}

function currentStateOf(member: TeamMember): TeamMember['state'] {
  const facts = terminalFactsOf(member.id)
  if (facts === undefined) {
    return 'starting'
  }
  const state = memberStateOf(facts, Date.now())
  return isDelivering(member.id) && state !== 'exited' ? 'starting' : state
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
    const reason = goneReasons.get(wanted)
    const hint =
      reason === undefined
        ? 'If it finished earlier, O-BROS may have stopped it to free memory; its answer is in its saved conversation.'
        : `It was stopped: ${reason}`
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
  if (member !== undefined && reason !== null) {
    goneReasons.set(member.name, reason)
  }
  members.delete(memberId)
  unreportedIds.delete(memberId)
  startingIds.delete(memberId)
  deliveries.delete(memberId)
  queuedSendCounts.delete(memberId)
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

async function noteExitedAtStart(member: TeamMember): Promise<void> {
  const screen = await lastScreenOf(member)
  goneReasons.set(
    member.name,
    `it exited right after it started, so its task was not sent. Its last output:\n${screen}\nFix the cause (for example pass agent options after --) and summon it again.`
  )
  updateState(member, 'exited')
  publish()
}

async function deliverFirstTask(member: TeamMember, task: string): Promise<void> {
  try {
    const hasStarted = await waitUntil(() => terminalFactsOf(member.id) !== undefined, TERMINAL_START_TIMEOUT_MS)
    if (!members.has(member.id)) {
      return
    }
    if (!hasStarted) {
      removeMember(member.id, 'the O-BROS window did not open its terminal. Is the window open?')
      return
    }
    await waitUntil(() => {
      const facts = terminalFactsOf(member.id)
      return facts === undefined || facts.hasExited || isReadyForInput(facts, Date.now())
    }, READY_TIMEOUT_MS)
    if (!members.has(member.id)) {
      return
    }
    if (terminalFactsOf(member.id)?.hasExited ?? true) {
      await noteExitedAtStart(member)
      return
    }
    if (task.trim() !== '') {
      await typeAndSubmit(member.id, task)
    }
  } catch (error) {
    if (members.has(member.id)) {
      removeMember(member.id, `its task could not be typed in: ${error instanceof Error ? error.message : String(error)}`)
    }
  } finally {
    startingIds.delete(member.id)
  }
}

export async function spawnMember(request: SpawnRequest): Promise<SpawnOutcome> {
  if (isTeamMember(request.callerPaneId)) {
    throw new WotError('not-allowed', 'A team member cannot summon more agents. Only the agent the user talks to can.')
  }
  if (members.size >= MAX_MEMBERS) {
    const ownCount = listOwnMembers(request.callerPaneId).length
    const advice =
      ownCount === 0
        ? 'All of them belong to other terminals. Tell the user, and wait until some of them are stopped.'
        : `${ownCount} of them are yours. Stop one you do not need with "wot stop <name>" first.`
    throw new WotError('limit', `The team is full (${MAX_MEMBERS} members in O-BROS). ${advice}`)
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
  startingIds.add(member.id)
  goneReasons.delete(member.name)
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

  deliveries.set(member.id, deliverFirstTask(member, request.task))
  return { member, taskQueued: request.task.trim() !== '', warnings }
}

export interface SendOutcome {
  member: TeamMember
  isQueued: boolean
}

function queueSend(member: TeamMember, text: string): void {
  queuedSendCounts.set(member.id, (queuedSendCounts.get(member.id) ?? 0) + 1)
  const previous = deliveries.get(member.id) ?? Promise.resolve()
  const next = previous
    .then(async () => {
      await waitUntil(() => {
        const facts = terminalFactsOf(member.id)
        return !members.has(member.id) || facts === undefined || facts.hasExited || isReadyForInput(facts, Date.now())
      }, READY_TIMEOUT_MS)
      const facts = terminalFactsOf(member.id)
      if (members.has(member.id) && facts !== undefined && !facts.hasExited) {
        await typeAndSubmit(member.id, text)
      }
    })
    .catch(() => undefined)
    .finally(() => {
      const count = (queuedSendCounts.get(member.id) ?? 1) - 1
      if (count <= 0) {
        queuedSendCounts.delete(member.id)
      } else {
        queuedSendCounts.set(member.id, count)
      }
    })
  deliveries.set(member.id, next)
}

export async function sendToMember(nameOrId: string, text: string): Promise<SendOutcome> {
  const member = findMember(nameOrId)
  assertTextLength(text)
  if (text.trim() === '') {
    throw new WotError('bad-request', 'There is no text to send.')
  }
  const facts = terminalFactsOf(member.id)
  const notRunning = new WotError('failed', `"${member.name}" is not running anymore. Stop it with "wot stop ${member.name}".`)
  if (facts?.hasExited === true) {
    throw notRunning
  }
  if (isDelivering(member.id)) {
    queueSend(member, text)
    return { member, isQueued: true }
  }
  if (facts === undefined) {
    throw notRunning
  }
  await typeAndSubmit(member.id, text)
  return { member, isQueued: false }
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
  ids.forEach((id) => removeMember(id, 'the user stopped all team members in O-BROS'))
  return ids.length
}

export function closeMemberById(memberId: string): void {
  if (members.has(memberId)) {
    removeMember(memberId, 'the user stopped it in O-BROS')
  }
}
