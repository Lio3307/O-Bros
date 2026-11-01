import type { AgentStatus } from '../../../shared/agentStatus'
import type { PaneNotice } from '../../../shared/paneNoticeText'
import { useAgentStatusStore } from '../../state/agentStatusStore'
import { turnOf } from './agentStatusTracking'
import { announceForPane } from './paneNotification'

type NotifiedStatus = 'done' | 'asking'

const NOTICE_OF: Record<NotifiedStatus, PaneNotice> = { done: 'finished', asking: 'asking' }

const notifiedKeys = new Map<string, Set<string>>()

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
    const seenKeys = notifiedKeys.get(paneId) ?? new Set<string>()
    if (key === null || seenKeys.has(key)) {
      continue
    }
    notifiedKeys.set(paneId, seenKeys.add(key))
    announceForPane(paneId, NOTICE_OF[status as NotifiedStatus])
  }
}

export function startAgentNotifications(): () => void {
  return useAgentStatusStore.subscribe((state, previous) => {
    if (state.statuses !== previous.statuses) {
      noticeStatuses(state.statuses)
    }
  })
}
