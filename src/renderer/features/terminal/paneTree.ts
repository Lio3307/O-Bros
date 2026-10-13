export type SplitDirection = 'horizontal' | 'vertical'

export type PaneLayout =
  | { kind: 'pane'; paneId: string }
  | { kind: 'split'; direction: SplitDirection; first: PaneLayout; second: PaneLayout }

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
