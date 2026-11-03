import { isPathInside } from '../../../shared/paths'
import type { WorkspaceTab } from '../../state/workspaceStore'

function terminalFolderOf(tab: WorkspaceTab): string | null {
  return tab.kind === 'terminal' ? (tab.panes[tab.focusedPaneId]?.cwd ?? tab.cwd) : null
}

export function nextFilesRoot(previousRoot: string | null, projectPath: string | null, activeTab: WorkspaceTab | undefined): string | null {
  if (projectPath === null) {
    return null
  }
  const keepsPrevious = previousRoot !== null && isPathInside(previousRoot, projectPath)
  if (activeTab === undefined) {
    return keepsPrevious ? previousRoot : projectPath
  }
  if (activeTab.kind === 'file') {
    return keepsPrevious && isPathInside(activeTab.path, previousRoot) ? previousRoot : projectPath
  }
  const folder = terminalFolderOf(activeTab)
  return folder !== null && isPathInside(folder, projectPath) ? folder : projectPath
}
