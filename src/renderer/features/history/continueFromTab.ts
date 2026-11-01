import { providerOfCommand } from '../../../shared/agentLaunchers'
import { useContinueDialogStore } from '../../state/continueDialogStore'
import { toast } from '../../state/toastStore'
import type { TerminalTab } from '../../state/workspaceStore'
import type { PopupMenuItem } from '../../ui/PopupMenu'
import type { ProviderId } from '../../../shared/types'

function readableProviderOfTab(tab: TerminalTab): ProviderId | null {
  const command = tab.panes[tab.focusedPaneId]?.startCommand ?? null
  return command === null ? null : providerOfCommand(command)
}

async function openDialogForTab(tab: TerminalTab, provider: ProviderId): Promise<void> {
  const cwd = tab.panes[tab.focusedPaneId]?.cwd ?? tab.cwd
  const sessionFilePath = cwd === null ? null : await window.api.history.latestSessionFile(provider, cwd, tab.createdAt).catch(() => null)
  if (sessionFilePath === null) {
    toast.warning('O-BROS has not found this conversation yet. Send the agent at least one message, wait a few seconds, then try again.')
    return
  }
  useContinueDialogStore.getState().open({ sessionFilePath, sessionId: null, title: tab.title, folder: cwd, provider })
}

export function continueInAnotherAgentItem(tab: TerminalTab): PopupMenuItem | null {
  const provider = readableProviderOfTab(tab)
  return provider === null ? null : { label: 'Continue in another agent…', onSelect: () => void openDialogForTab(tab, provider) }
}
