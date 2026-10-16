import type { DaySummary } from '../../../../shared/activityStats'
import { formatShortDuration } from '../../../../shared/time'
import { StatTile } from '../../../ui/StatTile'
import { StatusDot } from '../../../ui/StatusDot'

export function TodayTiles({ summary }: { summary: DaySummary }) {
  return (
    <div className="monitor-tiles">
      <StatTile value={formatShortDuration(summary.agentTimeMs)} label="Agent time" />
      <StatTile value={String(summary.sessionCount)} label="Sessions started" />
      <StatTile value={String(summary.gitAllowed + summary.gitDenied)} label="Git actions asked">
        <span className="monitor-tile-split">
          <span>
            <StatusDot tone="success" /> {summary.gitAllowed} allowed
          </span>
          <span>
            <StatusDot tone="danger" /> {summary.gitDenied} denied
          </span>
        </span>
      </StatTile>
      <StatTile value={String(summary.teamJoined)} label="Team members summoned" />
    </div>
  )
}
