import { DEFAULT_SPLIT_RATIO, type PaneLayout, type SplitDirection } from './paneTree'

export interface WorkspaceSplit {
  first: string
  second: string
  direction: SplitDirection
  ratio: number
}

export type DropSide = 'left' | 'right' | 'top' | 'bottom' | 'center'

const EDGE_SHARE = 0.34

export const TAB_DRAG_TYPE = 'application/x-o-bros-tab'
export const PANE_DRAG_TYPE = 'application/x-o-bros-pane'

export type EdgeSide = Exclude<DropSide, 'center'>

export function directionOfSide(side: EdgeSide): SplitDirection {
  return side === 'left' || side === 'right' ? 'horizontal' : 'vertical'
}

export function isBeforeSide(side: EdgeSide): boolean {
  return side === 'left' || side === 'top'
}

export function dropSideAt(x: number, y: number, width: number, height: number): DropSide {
  const distances: [DropSide, number][] = [
    ['left', x / width],
    ['right', 1 - x / width],
    ['top', y / height],
    ['bottom', 1 - y / height]
  ]
  const [side, distance] = distances.reduce((nearest, candidate) => (candidate[1] < nearest[1] ? candidate : nearest))
  return distance <= EDGE_SHARE ? side : 'center'
}

function holdsTab(split: WorkspaceSplit, tabId: string | null): boolean {
  return split.first === tabId || split.second === tabId
}

export function isShowingSplit(split: WorkspaceSplit | null, activeTabId: string | null): split is WorkspaceSplit {
  return split !== null && holdsTab(split, activeTabId)
}

export function otherTabOf(split: WorkspaceSplit, tabId: string): string {
  return split.first === tabId ? split.second : split.first
}

export function dropPartner(split: WorkspaceSplit | null, activeTabId: string | null, draggedTabId: string): string | null {
  if (activeTabId !== null && activeTabId !== draggedTabId) {
    return activeTabId
  }
  return isShowingSplit(split, draggedTabId) ? otherTabOf(split, draggedTabId) : null
}

export function splitFromDrop(side: EdgeSide, draggedTabId: string, partnerTabId: string): WorkspaceSplit {
  const isDraggedFirst = isBeforeSide(side)
  return {
    first: isDraggedFirst ? draggedTabId : partnerTabId,
    second: isDraggedFirst ? partnerTabId : draggedTabId,
    direction: directionOfSide(side),
    ratio: DEFAULT_SPLIT_RATIO
  }
}

export function layoutOfSplit(split: WorkspaceSplit): PaneLayout {
  return {
    kind: 'split',
    direction: split.direction,
    ratio: split.ratio,
    first: { kind: 'pane', paneId: split.first },
    second: { kind: 'pane', paneId: split.second }
  }
}

export interface SplitChange {
  split: WorkspaceSplit
  tabs: { id: string; kind: string }[]
  previousActiveTabId: string | null
  activeTabId: string | null
  isSameProject: boolean
}

function slotToReplace({ split, tabs, previousActiveTabId, activeTabId }: SplitChange): string {
  const kindOf = (tabId: string | null) => tabs.find((tab) => tab.id === tabId)?.kind
  const sameKind = [split.first, split.second].filter((tabId) => kindOf(tabId) === kindOf(activeTabId))
  if (sameKind.length === 1) {
    return sameKind[0]
  }
  return previousActiveTabId !== null && holdsTab(split, previousActiveTabId) ? previousActiveTabId : split.second
}

export function splitAfterChange(change: SplitChange): WorkspaceSplit | null {
  const { split, tabs, activeTabId, isSameProject } = change
  const exists = (tabId: string) => tabs.some((tab) => tab.id === tabId)
  if (!exists(split.first) || !exists(split.second)) {
    return null
  }
  if (activeTabId === null || holdsTab(split, activeTabId) || !isSameProject) {
    return split
  }
  const replaced = slotToReplace(change)
  return replaced === split.first ? { ...split, first: activeTabId } : { ...split, second: activeTabId }
}
