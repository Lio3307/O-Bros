import type { TerminalPaneInfo, TerminalTab } from '../../state/workspaceStore'
import { listPaneIds, removePaneFromLayout, type PaneLayout } from './paneTree'
import type { WorkspaceSplit } from './workspaceSplit'

function panesNamedAfterTab(tab: TerminalTab): Record<string, TerminalPaneInfo> {
  if (tab.layout.kind !== 'pane') {
    return tab.panes
  }
  const pane = tab.panes[tab.layout.paneId]
  return { [pane.id]: { ...pane, title: tab.title } }
}

export function joinTerminalTabs(kept: TerminalTab, moved: TerminalTab, split: WorkspaceSplit): TerminalTab {
  const layoutOf = (tabId: string): PaneLayout => (tabId === moved.id ? moved.layout : kept.layout)
  return {
    ...kept,
    layout: { kind: 'split', direction: split.direction, ratio: split.ratio, first: layoutOf(split.first), second: layoutOf(split.second) },
    panes: { ...panesNamedAfterTab(kept), ...panesNamedAfterTab(moved) },
    focusedPaneId: moved.focusedPaneId
  }
}

export interface SplitOffPane {
  remaining: TerminalTab
  tab: TerminalTab
}

export function splitOffPane(source: TerminalTab, paneId: string, newTabId: string, createdAt: number): SplitOffPane | null {
  const layout = removePaneFromLayout(source.layout, paneId)
  const pane = source.panes[paneId]
  if (layout === null || pane === undefined) {
    return null
  }
  const remainingIds = listPaneIds(layout)
  return {
    remaining: {
      ...source,
      layout,
      panes: Object.fromEntries(remainingIds.map((id) => [id, source.panes[id]])),
      focusedPaneId: source.focusedPaneId === paneId ? remainingIds[0] : source.focusedPaneId
    },
    tab: {
      kind: 'terminal',
      id: newTabId,
      title: pane.title,
      isTitleFromAgent: false,
      cwd: pane.cwd,
      createdAt,
      layout: { kind: 'pane', paneId },
      panes: { [paneId]: pane },
      focusedPaneId: paneId
    }
  }
}
