import type { DaySummary } from '../../../../shared/activityStats'
import { formatShortDuration } from '../../../../shared/time'
import { StatTile } from '../../../ui/StatTile'

export function TodayTiles({ summary }: { summary: DaySummary }) {
  return (
    <div className="monitor-tiles">
      <StatTile value={formatShortDuration(summary.agentTimeMs)} label="Agent time" />
      <StatTile value={String(summary.sessionCount)} label="Sessions started" />
    </div>
  )
}
