export type SplitDirection = 'horizontal' | 'vertical'

export type PaneLayout =
  | { kind: 'pane'; paneId: string }
  | { kind: 'split'; direction: SplitDirection; ratio?: number; first: PaneLayout; second: PaneLayout }

export function listPaneIds(layout: PaneLayout): string[] {
  if (layout.kind === 'pane') {
    return [layout.paneId]
  }
  return [...listPaneIds(layout.first), ...listPaneIds(layout.second)]
}

function placeBeside(layout: PaneLayout, targetPaneId: string, newPaneId: string, direction: SplitDirection, isBefore: boolean): PaneLayout {
  if (layout.kind === 'pane') {
    if (layout.paneId !== targetPaneId) {
      return layout
    }
    const added: PaneLayout = { kind: 'pane', paneId: newPaneId }
    return { kind: 'split', direction, first: isBefore ? added : layout, second: isBefore ? layout : added }
  }
  return {
    ...layout,
    first: placeBeside(layout.first, targetPaneId, newPaneId, direction, isBefore),
    second: placeBeside(layout.second, targetPaneId, newPaneId, direction, isBefore)
  }
}

export function splitPaneInLayout(layout: PaneLayout, targetPaneId: string, direction: SplitDirection, newPaneId: string): PaneLayout {
  return placeBeside(layout, targetPaneId, newPaneId, direction, false)
}

export function movePaneInLayout(layout: PaneLayout, paneId: string, targetPaneId: string, direction: SplitDirection, isBefore: boolean): PaneLayout {
  const withoutMoved = removePaneFromLayout(layout, paneId)
  if (withoutMoved === null || paneId === targetPaneId || !listPaneIds(withoutMoved).includes(targetPaneId)) {
    return layout
  }
  return placeBeside(withoutMoved, targetPaneId, paneId, direction, isBefore)
}

export function removePaneFromLayout(layout: PaneLayout, targetPaneId: string): PaneLayout | null {
  if (layout.kind === 'pane') {
    return layout.paneId === targetPaneId ? null : layout
  }
  const first = removePaneFromLayout(layout.first, targetPaneId)
  const second = removePaneFromLayout(layout.second, targetPaneId)
  if (first === null) {
    return second
  }
  if (second === null) {
    return first
  }
  return { ...layout, first, second }
}

export type SplitPath = ('first' | 'second')[]

export interface PaneRect {
  left: number
  top: number
  width: number
  height: number
}

export interface SplitDivider {
  path: SplitPath
  direction: SplitDirection
  region: PaneRect
  ratio: number
}

export const DEFAULT_SPLIT_RATIO = 0.5
const MIN_SPLIT_RATIO = 0.15
const MAX_SPLIT_RATIO = 0.85
const WHOLE_AREA: PaneRect = { left: 0, top: 0, width: 100, height: 100 }

export function clampSplitRatio(ratio: number): number {
  return Math.min(MAX_SPLIT_RATIO, Math.max(MIN_SPLIT_RATIO, ratio))
}

function ratioOf(layout: Extract<PaneLayout, { kind: 'split' }>): number {
  return layout.ratio === undefined ? DEFAULT_SPLIT_RATIO : clampSplitRatio(layout.ratio)
}

function dividePane(region: PaneRect, direction: SplitDirection, ratio: number): [PaneRect, PaneRect] {
  if (direction === 'horizontal') {
    const firstWidth = region.width * ratio
    return [
      { ...region, width: firstWidth },
      { ...region, left: region.left + firstWidth, width: region.width - firstWidth }
    ]
  }
  const firstHeight = region.height * ratio
  return [
    { ...region, height: firstHeight },
    { ...region, top: region.top + firstHeight, height: region.height - firstHeight }
  ]
}

export function computePaneRects(layout: PaneLayout, region: PaneRect = WHOLE_AREA): Record<string, PaneRect> {
  if (layout.kind === 'pane') {
    return { [layout.paneId]: region }
  }
  const [firstRegion, secondRegion] = dividePane(region, layout.direction, ratioOf(layout))
  return { ...computePaneRects(layout.first, firstRegion), ...computePaneRects(layout.second, secondRegion) }
}

export function listDividers(layout: PaneLayout, region: PaneRect = WHOLE_AREA, path: SplitPath = []): SplitDivider[] {
  if (layout.kind === 'pane') {
    return []
  }
  const ratio = ratioOf(layout)
  const [firstRegion, secondRegion] = dividePane(region, layout.direction, ratio)
  return [
    { path, direction: layout.direction, region, ratio },
    ...listDividers(layout.first, firstRegion, [...path, 'first']),
    ...listDividers(layout.second, secondRegion, [...path, 'second'])
  ]
}

export function setSplitRatio(layout: PaneLayout, path: SplitPath, ratio: number): PaneLayout {
  if (layout.kind === 'pane') {
    return layout
  }
  if (path.length === 0) {
    return { ...layout, ratio: clampSplitRatio(ratio) }
  }
  const [next, ...rest] = path
  return next === 'first'
    ? { ...layout, first: setSplitRatio(layout.first, rest, ratio) }
    : { ...layout, second: setSplitRatio(layout.second, rest, ratio) }
}

export type PaneDirection = 'left' | 'right' | 'up' | 'down'

const TOUCHING = 0.01

function gapTowards(from: PaneRect, to: PaneRect, direction: PaneDirection): number {
  const gaps: Record<PaneDirection, number> = {
    left: from.left - (to.left + to.width),
    right: to.left - (from.left + from.width),
    up: from.top - (to.top + to.height),
    down: to.top - (from.top + from.height)
  }
  return gaps[direction]
}

function overlapAcross(from: PaneRect, to: PaneRect, direction: PaneDirection): number {
  const isSideways = direction === 'left' || direction === 'right'
  const [start, size, otherStart, otherSize] = isSideways
    ? [from.top, from.height, to.top, to.height]
    : [from.left, from.width, to.left, to.width]
  return Math.min(start + size, otherStart + otherSize) - Math.max(start, otherStart)
}

export function paneInDirection(layout: PaneLayout, fromPaneId: string, direction: PaneDirection): string | null {
  const rects = computePaneRects(layout)
  const from = rects[fromPaneId]
  if (from === undefined) {
    return null
  }
  const candidates = Object.entries(rects)
    .filter(([paneId, rect]) => paneId !== fromPaneId && gapTowards(from, rect, direction) >= -TOUCHING && overlapAcross(from, rect, direction) > TOUCHING)
    .sort(
      ([, first], [, second]) =>
        gapTowards(from, first, direction) - gapTowards(from, second, direction) || overlapAcross(from, second, direction) - overlapAcross(from, first, direction)
    )
  return candidates[0]?.[0] ?? null
}
