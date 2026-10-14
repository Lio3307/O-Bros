export interface GraphCommit {
  hash: string
  parents: string[]
}

export interface GraphRow {
  hash: string
  lane: number
  above: (string | null)[]
  below: (string | null)[]
  parentLanes: number[]
  isMerge: boolean
}

function firstFreeLane(lanes: (string | null)[]): number {
  const free = lanes.indexOf(null)
  return free === -1 ? lanes.length : free
}

function withoutTrailingGaps(lanes: (string | null)[]): (string | null)[] {
  let end = lanes.length
  while (end > 0 && lanes[end - 1] === null) {
    end -= 1
  }
  return lanes.slice(0, end)
}

export function buildCommitGraph(commits: GraphCommit[]): GraphRow[] {
  const rows: GraphRow[] = []
  let lanes: (string | null)[] = []

  for (const commit of commits) {
    const above = [...lanes]
    const existingLane = lanes.indexOf(commit.hash)
    const lane = existingLane === -1 ? firstFreeLane(lanes) : existingLane
    const next = [...lanes]
    next[lane] = commit.hash

    for (let index = 0; index < next.length; index += 1) {
      if (index !== lane && next[index] === commit.hash) {
        next[index] = null
      }
    }

    const parentLanes: number[] = []
    const [firstParent, ...otherParents] = commit.parents

    if (firstParent === undefined) {
      next[lane] = null
    } else {
      const parentLaneElsewhere = next.findIndex((hash, index) => index !== lane && hash === firstParent)
      if (parentLaneElsewhere === -1) {
        next[lane] = firstParent
        parentLanes.push(lane)
      } else {
        next[lane] = null
        parentLanes.push(parentLaneElsewhere)
      }
    }

    for (const parent of otherParents) {
      const known = next.indexOf(parent)
      if (known !== -1) {
        parentLanes.push(known)
      } else {
        const free = firstFreeLane(next)
        next[free] = parent
        parentLanes.push(free)
      }
    }

    lanes = withoutTrailingGaps(next)
    rows.push({
      hash: commit.hash,
      lane,
      above,
      below: [...lanes],
      parentLanes,
      isMerge: commit.parents.length > 1
    })
  }

  return rows
}

export function laneCount(rows: GraphRow[]): number {
  return rows.reduce((widest, row) => Math.max(widest, row.lane + 1, row.above.length, row.below.length), 1)
}
