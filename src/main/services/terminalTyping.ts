import type { TypeResult } from '../../shared/types'
import { looksLikeWaitingForInput } from '../../shared/waitingPrompt'
import { writeToTerminal } from './ptyManager'
import { terminalFactsOf } from './terminalFacts'
import { isReadyForInput } from './wot/memberState'

const POLL_MS = 500
const AGENT_READY_TIMEOUT_MS = 60_000
const SUBMIT_DELAY_MS = 300
const TYPED_TEXT_SETTLED_MS = 600
const TYPED_TEXT_SETTLE_LIMIT_MS = 8000
const SUBMIT_TICK_MS = 100
const SUBMIT_CHECK_TICKS = 30
const WORKING_OUTPUT_TICKS = 8
const SUBMIT_ATTEMPTS = 2
const PASTE_START = '\u001b[200~'
const PASTE_END = '\u001b[201~'

export function delay(milliseconds: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, milliseconds))
}

export async function waitUntil(condition: () => boolean, timeoutMs: number): Promise<boolean> {
  const deadline = Date.now() + timeoutMs
  while (Date.now() < deadline) {
    if (condition()) {
      return true
    }
    await delay(POLL_MS)
  }
  return condition()
}

export function waitUntilReadyForInput(paneId: string, timeoutMs: number): Promise<boolean> {
  return waitUntil(() => {
    const facts = terminalFactsOf(paneId)
    return facts !== undefined && !facts.hasExited && isReadyForInput(facts, Date.now())
  }, timeoutMs)
}

function quietFor(paneId: string): number {
  const facts = terminalFactsOf(paneId)
  return facts === undefined ? Number.POSITIVE_INFINITY : Date.now() - (facts.lastOutputAt ?? facts.startedAt)
}

async function countOutputTicks(paneId: string): Promise<number> {
  let ticksWithOutput = 0
  let lastSeen = terminalFactsOf(paneId)?.lastOutputAt ?? null
  for (let tick = 0; tick < SUBMIT_CHECK_TICKS; tick += 1) {
    await delay(SUBMIT_TICK_MS)
    const latest = terminalFactsOf(paneId)?.lastOutputAt ?? null
    if (latest !== lastSeen) {
      ticksWithOutput += 1
    }
    lastSeen = latest
  }
  return ticksWithOutput
}

function hasExitedOrAsks(paneId: string): boolean {
  const facts = terminalFactsOf(paneId)
  return facts === undefined || facts.hasExited || looksLikeWaitingForInput(facts.tail)
}

export async function typeWhenReady(paneId: string, text: string): Promise<TypeResult> {
  if (text.trim() === '') {
    return { isSent: false, message: 'There was nothing to send.' }
  }
  const isReady = await waitUntilReadyForInput(paneId, AGENT_READY_TIMEOUT_MS)
  if (!isReady) {
    const hasExited = terminalFactsOf(paneId)?.hasExited ?? true
    return {
      isSent: false,
      message: hasExited
        ? 'The terminal closed before the agent was ready, so the handoff was not sent.'
        : 'The agent did not get ready within a minute, so the handoff was not sent. Check the terminal.'
    }
  }
  await typeAndSubmit(paneId, text)
  return { isSent: true, message: 'The handoff was sent to the agent.' }
}

export async function typeAndSubmit(paneId: string, text: string): Promise<void> {
  const withoutReturns = text.split('\r').join('')
  const isBracketedPaste = terminalFactsOf(paneId)?.isBracketedPaste ?? false
  const body = isBracketedPaste ? PASTE_START + withoutReturns + PASTE_END : withoutReturns.split('\n').join(' ')
  writeToTerminal(paneId, body)
  await delay(SUBMIT_DELAY_MS)
  await waitUntil(() => quietFor(paneId) >= TYPED_TEXT_SETTLED_MS, TYPED_TEXT_SETTLE_LIMIT_MS)
  for (let attempt = 1; attempt <= SUBMIT_ATTEMPTS; attempt += 1) {
    writeToTerminal(paneId, '\r')
    if ((await countOutputTicks(paneId)) >= WORKING_OUTPUT_TICKS || hasExitedOrAsks(paneId)) {
      return
    }
  }
}
