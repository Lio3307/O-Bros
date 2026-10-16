import type { LiveAgent } from '../../../shared/activity'
import { isTeamMemberPaneId } from '../../../shared/teamMemberName'
import { listTerminalRecords } from '../terminalFacts'
import { memberStateOf } from '../wot/memberState'
import { freshTypedAgents } from './typedAgents'

export async function listLiveAgents(): Promise<LiveAgent[]> {
  const typedAgents = await freshTypedAgents()
  const now = Date.now()
  return listTerminalRecords().flatMap(([paneId, record]): LiveAgent[] => {
    const typed = typedAgents.get(paneId)
    const agentCommand = record.agentCommand ?? typed?.program ?? null
    if (agentCommand === null || record.hasExited) {
      return []
    }
    return [
      {
        paneId,
        agentCommand,
        cwd: record.cwd,
        startedAt: typed?.since ?? record.startedAt,
        state: memberStateOf(record, now),
        isTeamMember: isTeamMemberPaneId(paneId)
      }
    ]
  })
}
