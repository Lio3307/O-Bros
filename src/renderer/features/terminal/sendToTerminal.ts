import { quotePathForShell } from '../../../shared/shellQuote'
import { toast } from '../../state/toastStore'
import { useWorkspaceStore } from '../../state/workspaceStore'

function findTargetPaneId(): string | null {
  const { tabs, activeTabId } = useWorkspaceStore.getState()
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  if (activeTab?.kind === 'terminal') {
    return activeTab.focusedPaneId
  }
  const lastTerminal = [...tabs].reverse().find((tab) => tab.kind === 'terminal')
  return lastTerminal?.kind === 'terminal' ? lastTerminal.focusedPaneId : null
}

export function sendPathToTerminal(path: string): void {
  const paneId = findTargetPaneId()
  if (paneId === null) {
    toast.warning('Open a terminal first, then send the path.')
    return
  }
  window.api.pty.input(paneId, `${quotePathForShell(path)} `)
  toast.success('Path sent to the terminal.')
}
