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

export function splitPaneInLayout(
  layout: PaneLayout,
  targetPaneId: string,
  direction: SplitDirection,
  newPaneId: string
): PaneLayout {
  if (layout.kind === 'pane') {
    if (layout.paneId !== targetPaneId) {
      return layout
    }
    return {
      kind: 'split',
      direction,
      first: layout,
      second: { kind: 'pane', paneId: newPaneId }
    }
  }
  return {
    ...layout,
    first: splitPaneInLayout(layout.first, targetPaneId, direction, newPaneId),
    second: splitPaneInLayout(layout.second, targetPaneId, direction, newPaneId)
  }
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
