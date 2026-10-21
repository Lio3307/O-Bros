import { accountToRef } from '../../../shared/accounts'
import { agentStatusOf, providerOfCommand, type AgentLauncher } from '../../../shared/agentLaunchers'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { ProviderId } from '../../../shared/types'
import { selectActiveAccount, useAccountsStore } from '../../state/accountsStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useHistoryStore } from '../../state/historyStore'
import { useInstalledCommandsStore } from '../../state/installedCommandsStore'
import { useLayoutStore } from '../../state/layoutStore'
import { toast } from '../../state/toastStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import type { PopupMenuItem } from '../../ui/PopupMenu'

function openHandoffTerminal(cwd: string, command: string, title: string): string | null {
  const provider = providerOfCommand(command)
  const account = provider === null ? null : accountToRef(selectActiveAccount(useAccountsStore.getState(), provider))
  useWorkspaceStore.getState().openTerminalTab({ cwd, account, startCommand: command, title })
  useLayoutStore.getState().showSection('projects')
  const workspace = useWorkspaceStore.getState()
  const tab = workspace.tabs.filter(isTerminalTab).find((candidate) => candidate.id === workspace.activeTabId)
  return tab?.focusedPaneId ?? null
}

export async function continueWithAgent(sessionFilePath: string, launcher: AgentLauncher): Promise<void> {
  toast.info(`Preparing the handoff for ${launcher.name}…`)
  let plan
  try {
    plan = await window.api.history.continueWith({ sessionFilePath, agentCommand: launcher.command })
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not prepare the handoff.'))
    return
  }
  const paneId = openHandoffTerminal(plan.cwd, plan.command, `${launcher.name} (continued)`)
  if (paneId === null) {
    toast.error('Could not open a terminal for the agent.')
    return
  }
  const result = await window.api.pty.typeWhenReady(paneId, plan.handoffText)
  if (result.isSent) {
    toast.success(`${launcher.name} got the handoff and continues the conversation.`)
  } else {
    toast.warning(result.message)
  }
  void useHistoryStore.getState().loadThreads()
}

export function continueMenuItems(sessionFilePath: string, sourceProvider: ProviderId | null): PopupMenuItem[] {
  const launchers = useAgentLaunchersStore.getState().launchers
  const installedCommands = useInstalledCommandsStore.getState().commands
  if (launchers.length === 0) {
    return [{ label: 'Add your agents in Settings → Agents first', isDisabled: true, onSelect: () => undefined }]
  }
  return launchers.map((launcher) => {
    const status = agentStatusOf(launcher.command, installedCommands)
    const isMissing = status === 'missing'
    const isSameAgent = sourceProvider !== null && providerOfCommand(launcher.command) === sourceProvider
    return {
      label: launcher.name,
      hint: isMissing ? 'not installed' : isSameAgent ? 'new conversation' : undefined,
      isDisabled: isMissing,
      onSelect: () => void continueWithAgent(sessionFilePath, launcher)
    }
  })
}
