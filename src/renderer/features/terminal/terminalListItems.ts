import { lastPathSegment } from '../../../shared/paths'
import { matchesAllWords } from '../../../shared/textSearch'
import type { WorkspaceTab } from '../../state/workspaceStore'
import { listPaneIds } from './paneTree'

export interface TerminalListItem {
  paneId: string
  title: string
  place: string
  agentCommand: string | null
  isCurrent: boolean
}

export function terminalListItems(tabs: WorkspaceTab[], activeTabId: string | null, query: string): TerminalListItem[] {
  const items = tabs.flatMap((tab) => {
    if (tab.kind !== 'terminal') {
      return []
    }
    const paneIds = listPaneIds(tab.layout)
    const isSplit = paneIds.length > 1
    return paneIds.map((paneId, index) => {
      const pane = tab.panes[paneId]
      const folder = pane.cwd === null ? 'Home' : lastPathSegment(pane.cwd)
      return {
        paneId,
        title: isSplit && pane.title !== tab.title ? `${tab.title} · ${pane.title}` : tab.title,
        place: isSplit ? `${folder} · pane ${index + 1} of ${paneIds.length}` : folder,
        agentCommand: pane.isAgentRunning ? pane.agentCommand : null,
        isCurrent: tab.id === activeTabId && tab.focusedPaneId === paneId
      }
    })
  })
  return items.filter((item) => matchesAllWords([item.title, item.place, item.agentCommand ?? ''].join(' '), query.trim()))
}
