import type { Transport } from '@codemirror/lsp-client'

type MessageHandler = (message: string) => void

const handlersBySession = new Map<string, Set<MessageHandler>>()
let isListening = false

function listenOnce(): void {
  if (isListening) {
    return
  }
  isListening = true
  window.api.lsp.onMessage(({ sessionId, message }) => {
    handlersBySession.get(sessionId)?.forEach((handler) => handler(message))
  })
}

export function ipcTransport(sessionId: string): Transport {
  listenOnce()
  return {
    send: (message) => window.api.lsp.send(sessionId, message),
    subscribe: (handler) => {
      const handlers = handlersBySession.get(sessionId) ?? new Set<MessageHandler>()
      handlers.add(handler)
      handlersBySession.set(sessionId, handlers)
    },
    unsubscribe: (handler) => {
      handlersBySession.get(sessionId)?.delete(handler)
    }
  }
}

export function forgetTransport(sessionId: string): void {
  handlersBySession.delete(sessionId)
}
