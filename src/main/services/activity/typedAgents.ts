import { formatDuration } from '../../../shared/time'
import { listRunningTerminals } from '../ptyManager'
import { collectProcessTree, readProcessTable } from '../resources/processTable'
import { terminalFactsOf } from '../terminalFacts'
import { loadAgentCatalog } from '../wot/agentCatalog'
import { agentProgramOf } from '../wot/agentCaller'
import { recordActivity } from './activityLog'

export interface TypedAgent {
  program: string
  since: number
  cwd: string | null
}

const SCAN_EVERY_MS = 20_000
const FRESH_ENOUGH_MS = 10_000
const SCAN_AFTER_ENTER_MS = 3000
const ENTER_KEY = '\r'

const typedAgents = new Map<string, TypedAgent>()
let lastScanAt = 0
let scanning: Promise<void> | null = null
let enterScanTimer: NodeJS.Timeout | null = null

function recordSession(agent: TypedAgent, text: string, durationMs: number | null): void {
  void recordActivity({ kind: 'session', agentCommand: agent.program, folder: agent.cwd, text, detail: null, outcome: null, durationMs })
}

function finish(paneId: string, agent: TypedAgent, now: number): void {
  typedAgents.delete(paneId)
  recordSession(agent, `closed after ${formatDuration(now - agent.since)}`, now - agent.since)
}

function plainTerminals(): { id: string; pid: number }[] {
  return listRunningTerminals().filter(({ id }) => (terminalFactsOf(id)?.agentCommand ?? null) === null)
}

async function scan(): Promise<void> {
  const terminals = plainTerminals()
  const now = Date.now()
  if (terminals.length === 0 && typedAgents.size === 0) {
    return
  }
  const [table, catalog] = await Promise.all([readProcessTable(), loadAgentCatalog()])
  const runningIds = new Set(terminals.map(({ id }) => id))
  for (const [paneId, agent] of typedAgents) {
    if (!runningIds.has(paneId)) {
      finish(paneId, agent, now)
    }
  }
  for (const { id, pid } of terminals) {
    const children = collectProcessTree(table, pid).filter((entry) => entry.pid !== pid)
    const program = children.map((entry) => agentProgramOf(entry, catalog.programs)).find((found) => found !== null) ?? null
    const known = typedAgents.get(id)
    if (known !== undefined && known.program !== program) {
      finish(id, known, now)
    }
    if (program !== null && typedAgents.get(id) === undefined) {
      const agent = { program, since: now, cwd: terminalFactsOf(id)?.cwd ?? null }
      typedAgents.set(id, agent)
      recordSession(agent, 'started', null)
    }
  }
}

export function scanTypedAgents(): Promise<void> {
  scanning ??= scan()
    .catch(() => undefined)
    .finally(() => {
      lastScanAt = Date.now()
      scanning = null
    })
  return scanning
}

export async function freshTypedAgents(): Promise<Map<string, TypedAgent>> {
  if (Date.now() - lastScanAt > FRESH_ENOUGH_MS) {
    await scanTypedAgents()
  }
  return typedAgents
}

export function noteAgentSeen(paneId: string, program: string): void {
  const facts = terminalFactsOf(paneId)
  if (facts === undefined || facts.agentCommand !== null || facts.hasExited || typedAgents.has(paneId)) {
    return
  }
  const agent = { program, since: Date.now(), cwd: facts.cwd }
  typedAgents.set(paneId, agent)
  recordSession(agent, 'started', null)
}

export function noteTerminalInputForAgents(paneId: string, data: string): void {
  if (!data.includes(ENTER_KEY) || enterScanTimer !== null || (terminalFactsOf(paneId)?.agentCommand ?? null) !== null) {
    return
  }
  enterScanTimer = setTimeout(() => {
    enterScanTimer = null
    void freshTypedAgents()
  }, SCAN_AFTER_ENTER_MS)
}

export function startTypedAgentWatch(): void {
  setInterval(() => {
    if (typedAgents.size > 0) {
      void scanTypedAgents()
    }
  }, SCAN_EVERY_MS)
}
