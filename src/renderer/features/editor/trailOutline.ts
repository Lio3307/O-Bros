export interface Box {
  left: number
  top: number
  width: number
  height: number
}

export type Point = [number, number]

const TAIL_HEIGHT_SHARE = 0.3

function turn(origin: Point, a: Point, b: Point): number {
  return (a[0] - origin[0]) * (b[1] - origin[1]) - (a[1] - origin[1]) * (b[0] - origin[0])
}

function halfHull(points: Point[]): Point[] {
  const hull: Point[] = []
  for (const point of points) {
    while (hull.length >= 2 && turn(hull[hull.length - 2], hull[hull.length - 1], point) <= 0) {
      hull.pop()
    }
    hull.push(point)
  }
  hull.pop()
  return hull
}

function outlineAround(points: Point[]): Point[] {
  const sorted = [...points].sort((a, b) => a[0] - b[0] || a[1] - b[1])
  return [...halfHull(sorted), ...halfHull([...sorted].reverse())]
}

export function trailOutline(from: Box, to: Box): Point[] {
  const tailX = from.left + from.width / 2
  const tailY = from.top + from.height / 2
  const tailHalf = (from.height * TAIL_HEIGHT_SHARE) / 2
  const right = to.left + to.width
  const bottom = to.top + to.height
  return outlineAround([
    [tailX, tailY - tailHalf],
    [tailX, tailY + tailHalf],
    [to.left, to.top],
    [right, to.top],
    [right, bottom],
    [to.left, bottom]
  ])
}
