import { accountToRef } from '../../../shared/accounts'
import { providerOfCommand, type AgentLauncher } from '../../../shared/agentLaunchers'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { selectActiveAccount, useAccountsStore } from '../../state/accountsStore'
import { useHistoryStore } from '../../state/historyStore'
import { useLayoutStore } from '../../state/layoutStore'
import { toast } from '../../state/toastStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'

function openHandoffTerminal(cwd: string, command: string, title: string): string | null {
  const provider = providerOfCommand(command)
  const account = provider === null ? null : accountToRef(selectActiveAccount(useAccountsStore.getState(), provider))
  useWorkspaceStore.getState().openTerminalTab({ cwd, account, startCommand: command, title })
  useLayoutStore.getState().showSection('projects')
  const workspace = useWorkspaceStore.getState()
  const tab = workspace.tabs.filter(isTerminalTab).find((candidate) => candidate.id === workspace.activeTabId)
  return tab?.focusedPaneId ?? null
}

function hiddenNote(hiddenCount: number): string {
  if (hiddenCount === 0) {
    return ''
  }
  const things = hiddenCount === 1 ? '1 thing that looked like a password or key was' : `${hiddenCount} things that looked like passwords or keys were`
  return ` ${things} replaced with [hidden] and not sent.`
}

export async function continueWithAgent(sessionFilePath: string, launcher: Pick<AgentLauncher, 'name' | 'command'>): Promise<void> {
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
    toast.success(`${launcher.name} got the handoff and continues the conversation.${hiddenNote(plan.hiddenCount)}`)
  } else {
    toast.warning(result.message)
  }
  void useHistoryStore.getState().loadThreads()
}
