import { quotePathForShell } from '../../../shared/shellQuote'
import { tabsInActiveProject } from '../../state/activeProjectTabs'
import { toast } from '../../state/toastStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { pasteIntoTerminal } from './terminalRegistry'

function findTargetPaneId(): string | null {
  const tabs = tabsInActiveProject()
  const { activeTabId } = useWorkspaceStore.getState()
  const activeTab = tabs.find((tab) => tab.id === activeTabId)
  if (activeTab?.kind === 'terminal') {
    return activeTab.focusedPaneId
  }
  const lastTerminal = [...tabs].reverse().find((tab) => tab.kind === 'terminal')
  return lastTerminal?.kind === 'terminal' ? lastTerminal.focusedPaneId : null
}

const ENTER_KEY = '\r'

export function sendPromptToTerminal(text: string, pressEnter: boolean): boolean {
  const paneId = findTargetPaneId()
  if (paneId === null || !pasteIntoTerminal(paneId, text)) {
    toast.warning('Open a terminal first, then send the prompt.')
    return false
  }
  if (pressEnter) {
    window.api.pty.input(paneId, ENTER_KEY)
  }
  return true
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
