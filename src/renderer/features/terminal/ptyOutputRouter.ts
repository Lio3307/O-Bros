interface PaneHandlers {
  onOutput: (chunk: string) => void
  onExit: () => void
}

const handlersByPane = new Map<string, PaneHandlers>()
let isListening = false

function listenOnce(): void {
  if (isListening) {
    return
  }
  isListening = true
  window.api.pty.onData((event) => handlersByPane.get(event.id)?.onOutput(event.chunk))
  window.api.pty.onExit((event) => handlersByPane.get(event.id)?.onExit())
}

export function routePaneOutput(paneId: string, handlers: PaneHandlers): () => void {
  listenOnce()
  handlersByPane.set(paneId, handlers)
  return () => {
    handlersByPane.delete(paneId)
  }
}
