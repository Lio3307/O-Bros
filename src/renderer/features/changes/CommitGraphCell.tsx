import type { GraphRow } from './commitGraph'

const LANE_WIDTH = 14
const MAX_VISIBLE_LANES = 5
const DEFAULT_DOT_Y = 22
const DOT_RADIUS = 4
const LANE_COLORS = ['#58a6ff', '#3fb950', '#d29922', '#bc8cff', '#f778ba']

function visibleLane(lane: number): number {
  return Math.min(lane, MAX_VISIBLE_LANES - 1)
}

function laneX(lane: number): number {
  return visibleLane(lane) * LANE_WIDTH + LANE_WIDTH / 2
}

function laneColor(lane: number): string {
  return LANE_COLORS[visibleLane(lane) % LANE_COLORS.length]
}

export function graphWidth(laneTotal: number): number {
  return Math.min(laneTotal, MAX_VISIBLE_LANES) * LANE_WIDTH
}

interface CommitGraphCellProps {
  row: GraphRow
  laneTotal: number
  dotY?: number
}

export function CommitGraphCell({ row, laneTotal, dotY = DEFAULT_DOT_Y }: CommitGraphCellProps) {
  const width = graphWidth(laneTotal)
  const dotColor = laneColor(row.lane)

  const incomingLines = row.above.flatMap((hash, lane) => {
    if (hash === null) {
      return []
    }
    const endLane = hash === row.hash ? row.lane : lane
    return [{ lane, endLane }]
  })

  const passingLanes = row.below.flatMap((hash, lane) =>
    hash !== null && row.above[lane] === hash && hash !== row.hash ? [lane] : []
  )

  return (
    <div className="commit-graph" style={{ width }} aria-hidden="true">
      <svg width={width} height={dotY} viewBox={`0 0 ${width} ${dotY}`} overflow="visible">
        {incomingLines.map(({ lane, endLane }) => (
          <line
            key={lane}
            x1={laneX(lane)}
            y1={0}
            x2={laneX(endLane)}
            y2={dotY}
            stroke={laneColor(lane)}
            strokeWidth={2}
          />
        ))}
        <circle
          cx={laneX(row.lane)}
          cy={dotY}
          r={DOT_RADIUS}
          fill={row.isMerge ? 'var(--color-panel)' : dotColor}
          stroke={dotColor}
          strokeWidth={2}
        />
      </svg>
      <svg
        className="commit-graph-tail"
        width={width}
        viewBox={`0 0 ${width} ${dotY}`}
        preserveAspectRatio="none"
      >
        {passingLanes.map((lane) => (
          <line
            key={`pass-${lane}`}
            x1={laneX(lane)}
            y1={0}
            x2={laneX(lane)}
            y2={dotY}
            stroke={laneColor(lane)}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
        {row.parentLanes.map((parentLane, index) => (
          <line
            key={`parent-${index}`}
            x1={laneX(row.lane)}
            y1={0}
            x2={laneX(parentLane)}
            y2={dotY}
            stroke={laneColor(parentLane)}
            strokeWidth={2}
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>
    </div>
  )
}
