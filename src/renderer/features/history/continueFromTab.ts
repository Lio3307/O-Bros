import { providerOfCommand } from '../../../shared/agentLaunchers'
import type { ProviderId } from '../../../shared/types'
import { toast } from '../../state/toastStore'
import type { TerminalTab } from '../../state/workspaceStore'
import type { PopupMenuItem } from '../../ui/PopupMenu'
import { continueMenuItems } from './continueWithAgent'

export function readableProviderOfTab(tab: TerminalTab): ProviderId | null {
  const command = tab.panes[tab.focusedPaneId]?.startCommand ?? null
  return command === null ? null : providerOfCommand(command)
}

export async function continueItemsForTab(tab: TerminalTab, provider: ProviderId): Promise<PopupMenuItem[] | null> {
  const cwd = tab.panes[tab.focusedPaneId]?.cwd ?? tab.cwd
  const sessionFilePath = cwd === null ? null : await window.api.history.latestSessionFile(provider, cwd, tab.createdAt).catch(() => null)
  if (sessionFilePath === null) {
    toast.warning('O-BROS has not found this conversation yet. Send the agent at least one message, wait a few seconds, then try again.')
    return null
  }
  return continueMenuItems(sessionFilePath, provider)
}

export function continueInAnotherAgentItem(tab: TerminalTab, reopen: (items: PopupMenuItem[]) => void): PopupMenuItem | null {
  const provider = readableProviderOfTab(tab)
  if (provider === null) {
    return null
  }
  return {
    label: 'Continue in another agent…',
    onSelect: () => {
      void continueItemsForTab(tab, provider).then((items) => {
        if (items !== null) {
          reopen(items)
        }
      })
    }
  }
}
