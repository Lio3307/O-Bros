import { randomUUID } from 'node:crypto'
import type { WebContents } from 'electron'
import { IpcChannel } from '../../../shared/ipc'
import type { WotRendererRequest } from '../../../shared/types'

const ANSWER_TIMEOUT_MS = 8000

interface PendingAnswer {
  resolve: (value: unknown) => void
  reject: (error: Error) => void
  timer: NodeJS.Timeout
}

let target: WebContents | null = null
const pendingAnswers = new Map<string, PendingAnswer>()

function liveTarget(): WebContents | null {
  return target !== null && !target.isDestroyed() ? target : null
}

export function setBridgeTarget(webContents: WebContents): void {
  target = webContents
}

export function sendToInterface(channel: string, payload: unknown): void {
  liveTarget()?.send(channel, payload)
}

export function askInterface<Answer>(request: WotRendererRequest, timeoutMs = ANSWER_TIMEOUT_MS): Promise<Answer> {
  const webContents = liveTarget()
  if (webContents === null) {
    return Promise.reject(new Error('The O-BROS window is not open.'))
  }
  const requestId = randomUUID()
  return new Promise<Answer>((resolve, reject) => {
    const timer = setTimeout(() => {
      pendingAnswers.delete(requestId)
      reject(new Error('The O-BROS window did not answer in time.'))
    }, timeoutMs)
    pendingAnswers.set(requestId, { resolve: (value) => resolve(value as Answer), reject, timer })
    webContents.send(IpcChannel.wotRequest, { requestId, request })
  })
}

export function receiveInterfaceAnswer(requestId: string, answer: unknown, errorMessage: string | null): void {
  const pending = pendingAnswers.get(requestId)
  if (pending === undefined) {
    return
  }
  clearTimeout(pending.timer)
  pendingAnswers.delete(requestId)
  if (errorMessage !== null) {
    pending.reject(new Error(errorMessage))
    return
  }
  pending.resolve(answer)
}
