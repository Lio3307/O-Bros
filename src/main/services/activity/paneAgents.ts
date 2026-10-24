import { IpcChannel, type PaneAgentEvent } from '../../../shared/ipc'
import { sendToInterface } from '../wot/rendererBridge'

const agentByPane = new Map<string, string | null>()

export function notePaneAgent(paneId: string, agentCommand: string | null): void {
  if ((agentByPane.get(paneId) ?? null) === agentCommand) {
    return
  }
  agentByPane.set(paneId, agentCommand)
  const event: PaneAgentEvent = { id: paneId, agentCommand }
  sendToInterface(IpcChannel.ptyAgentChanged, event)
}

export function forgetPanesExcept(runningPaneIds: Set<string>): void {
  for (const paneId of agentByPane.keys()) {
    if (!runningPaneIds.has(paneId)) {
      agentByPane.delete(paneId)
    }
  }
}
