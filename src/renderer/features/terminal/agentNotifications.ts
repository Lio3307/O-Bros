import type { AgentStatus } from '../../../shared/agentStatus'
import { useAgentStatusStore } from '../../state/agentStatusStore'
import { turnOf } from './agentStatusTracking'
import { announceForPane } from './paneNotification'

type NotifiedStatus = 'done' | 'asking'

const MESSAGES: Record<NotifiedStatus, [string, string]> = {
  done: ['finished', 'It is done and waiting for your next message.'],
  asking: ['is asking you', 'It needs your answer to go on.']
}

const notifiedKeys = new Map<string, string>()

export function notificationKeyOf(status: AgentStatus, turn: number): string | null {
  return status === 'done' || status === 'asking' ? `${status}@${turn}` : null
}

function noticeStatuses(statuses: Record<string, AgentStatus>): void {
  for (const paneId of notifiedKeys.keys()) {
    if (!(paneId in statuses)) {
      notifiedKeys.delete(paneId)
    }
  }
  for (const [paneId, status] of Object.entries(statuses)) {
    const turn = turnOf(paneId)
    const key = turn === null ? null : notificationKeyOf(status, turn)
    if (key === null || notifiedKeys.get(paneId) === key) {
      continue
    }
    notifiedKeys.set(paneId, key)
    const [happened, detail] = MESSAGES[status as NotifiedStatus]
    announceForPane(paneId, happened, detail)
  }
}

export function startAgentNotifications(): () => void {
  return useAgentStatusStore.subscribe((state, previous) => {
    if (state.statuses !== previous.statuses) {
      noticeStatuses(state.statuses)
    }
  })
}
