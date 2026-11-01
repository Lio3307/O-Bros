import { spawn, type ChildProcess } from 'node:child_process'
import { applyRunEvent, newTurnProgress, parseRunLine, turnFailure, type HeadlessAgent, type MemberAccess, type RunEvent, type TurnProgress } from '../../../shared/headlessAgents'
import { commandWithArguments, runOnceArguments, shellKindOf } from '../../../shared/shellCommand'
import type { TeamMemberState } from '../../../shared/types'
import { killProcessTree } from '../processTree'
import { WotError } from './wotError'

const CTRL_C = '\u0003'
const LINE_BREAK = '\r\n'
const MAX_LOG_LINES = 400
const MAX_ERROR_OUTPUT = 4000
const EXIT_SETTLE_MS = 2000
const STOPPED_BY_USER = 'The user stopped this task with Ctrl+C. Ask the user before you send it more work.'

export interface RunProcess {
  pid: number
  write: (data: string) => void
  resize: (columns: number, rows: number) => void
  kill: () => void
}

export interface RunPane {
  shell: string
  environment: Record<string, string>
  show: (chunk: string) => void
  track: (process: RunProcess) => void
  untrack: () => void
}

export interface NewRun {
  agent: HeadlessAgent
  command: string
  agentArgs: string[]
  access: MemberAccess
  cwd: string
  sessionId: string | null
  onSessionId: (sessionId: string) => void
}

interface Run extends NewRun {
  pane: RunPane | null
  pendingText: string | null
  child: ChildProcess | null
  wasStoppedByUser: boolean
  hasConversation: boolean
  turnCount: number
  answer: string
  failure: string | null
  log: string[]
}

export interface RunReport {
  answer: string
  failure: string | null
}

const runs = new Map<string, Run>()

export function createRun(memberId: string, details: NewRun): void {
  runs.set(memberId, {
    ...details,
    pane: null,
    pendingText: null,
    child: null,
    wasStoppedByUser: false,
    hasConversation: false,
    turnCount: 0,
    answer: '',
    failure: null,
    log: []
  })
}

export function isRunMember(memberId: string): boolean {
  return runs.has(memberId)
}

function showLine(run: Run, line: string): void {
  run.log = [...run.log, ...line.split('\n')].slice(-MAX_LOG_LINES)
  run.pane?.show(line.split('\n').join(LINE_BREAK) + LINE_BREAK)
}

function showEvent(run: Run, event: RunEvent): void {
  if (event.kind === 'text') {
    showLine(run, event.text)
  } else if (event.kind === 'activity') {
    showLine(run, `· ${event.label}`)
  } else if (event.kind === 'problem' || event.kind === 'failed') {
    showLine(run, `! ${event.text}`)
  }
}

function finishTurn(run: Run, progress: TurnProgress, exitCode: number | null, errorOutput: string): void {
  run.child = null
  run.pane?.untrack()
  run.answer = progress.answer
  run.failure = run.wasStoppedByUser ? STOPPED_BY_USER : turnFailure(progress, exitCode, errorOutput)
  showLine(run, run.failure === null ? '--- Finished ---' : `--- Could not finish: ${run.failure} ---`)
}

function startProcess(run: Run, pane: RunPane, text: string): void {
  const turn = { access: run.access, sessionId: run.sessionId, hasConversation: run.hasConversation }
  const kind = shellKindOf(process.platform)
  const command = commandWithArguments(run.command, [...run.agent.argumentsFor(turn), ...run.agentArgs], kind)
  const child = spawn(pane.shell, runOnceArguments(command, kind), { cwd: run.cwd, env: pane.environment, stdio: ['pipe', 'pipe', 'pipe'], windowsHide: true })

  let progress = newTurnProgress(run.sessionId)
  let pendingOutput = ''
  let errorOutput = ''
  let hasFinished = false
  let settleTimer: NodeJS.Timeout | null = null

  function finish(exitCode: number | null): void {
    if (hasFinished) {
      return
    }
    hasFinished = true
    if (settleTimer !== null) {
      clearTimeout(settleTimer)
    }
    finishTurn(run, progress, exitCode, errorOutput)
  }

  function readLine(line: string): void {
    const events = parseRunLine(run.agent, line)
    if (events === null) {
      if (line.trim() !== '') {
        showLine(run, line.trimEnd())
      }
      return
    }
    for (const event of events) {
      progress = applyRunEvent(progress, event)
      showEvent(run, event)
      if (event.kind === 'session') {
        run.hasConversation = true
        if (run.sessionId !== event.id) {
          run.sessionId = event.id
          run.onSessionId(event.id)
        }
      }
    }
  }

  run.child = child
  child.stdout.setEncoding('utf8')
  child.stderr.setEncoding('utf8')
  child.stdout.on('data', (chunk: string) => {
    const lines = (pendingOutput + chunk).split('\n')
    pendingOutput = lines.pop() ?? ''
    lines.forEach(readLine)
  })
  child.stderr.on('data', (chunk: string) => {
    errorOutput = (errorOutput + chunk).slice(-MAX_ERROR_OUTPUT)
  })
  child.stdin.on('error', () => undefined)
  child.on('error', (error) => {
    errorOutput = error.message
    finish(null)
  })
  child.on('close', (exitCode) => {
    readLine(pendingOutput)
    pendingOutput = ''
    finish(exitCode)
  })
  child.on('exit', (exitCode) => {
    settleTimer = setTimeout(() => finish(exitCode), EXIT_SETTLE_MS)
  })
  pane.track({
    pid: child.pid ?? 0,
    resize: () => undefined,
    write: (data) => {
      if (data.includes(CTRL_C)) {
        run.wasStoppedByUser = true
        killProcessTree(child)
      }
    },
    kill: () => killProcessTree(child)
  })
  child.stdin.end(text)
}

function startTurn(run: Run, pane: RunPane, text: string): void {
  run.turnCount += 1
  run.wasStoppedByUser = false
  run.answer = ''
  run.failure = null
  showLine(run, `${LINE_BREAK}> ${text.trim()}${LINE_BREAK}`)
  startProcess(run, pane, text)
}

export function attachRunPane(memberId: string, pane: RunPane): void {
  const run = runs.get(memberId)
  if (run === undefined) {
    return
  }
  run.pane = pane
  const access = run.access === 'edit' ? 'It can edit files in this folder.' : 'It can only read files.'
  showLine(run, `O-BROS runs this team member one task at a time. ${access}\nYou can watch here. Typing is off; Ctrl+C stops the current task.`)
  if (run.pendingText !== null) {
    const text = run.pendingText
    run.pendingText = null
    startTurn(run, pane, text)
  }
}

export function sendToRun(memberId: string, memberName: string, text: string): boolean {
  const run = runs.get(memberId)
  if (run === undefined) {
    throw new WotError('failed', `"${memberName}" is not running anymore. Stop it with "wot stop ${memberName}".`)
  }
  if (run.child !== null || run.pendingText !== null) {
    throw new WotError('failed', `"${memberName}" is still working on its task. Run "wot wait ${memberName}" first, then send this.`)
  }
  if (run.pane === null) {
    run.pendingText = text
    return true
  }
  startTurn(run, run.pane, text)
  return false
}

export function hasRunTask(memberId: string): boolean {
  const run = runs.get(memberId)
  return run !== undefined && (run.turnCount > 0 || run.pendingText !== null)
}

export function runStateOf(memberId: string): TeamMemberState | null {
  const run = runs.get(memberId)
  if (run === undefined) {
    return null
  }
  if (run.child !== null || run.pendingText !== null) {
    return 'working'
  }
  return run.turnCount === 0 ? 'starting' : 'idle'
}

export function runReportOf(memberId: string): RunReport | null {
  const run = runs.get(memberId)
  return run === undefined ? null : { answer: run.answer, failure: run.failure }
}

export function readRun(memberId: string, lines: number): string {
  const run = runs.get(memberId)
  if (run === undefined) {
    return ''
  }
  const isFinished = run.child === null && run.answer !== ''
  return isFinished ? run.answer : run.log.slice(-lines).join('\n')
}

export function removeRun(memberId: string): void {
  const run = runs.get(memberId)
  if (run?.child !== null && run?.child !== undefined) {
    killProcessTree(run.child)
    run.pane?.untrack()
  }
  runs.delete(memberId)
}
