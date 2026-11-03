import { accountToRef } from '../../../shared/accounts'
import { providerOfCommand, type AgentLauncher } from '../../../shared/agentLaunchers'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { ProviderId } from '../../../shared/types'
import { useHandoffStore, type Handoff, type HandoffStep } from '../../state/handoffStore'
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

const DONE_SHOWN_MS = 4000

function handoffReporter(fromProvider: ProviderId, launcher: Pick<AgentLauncher, 'name' | 'command'>) {
  let current: Handoff | null = null
  const report = (step: HandoffStep, paneId: string | null = null, note = ''): void => {
    current = { fromProvider, toName: launcher.name, toCommand: launcher.command, step, paneId, note }
    useHandoffStore.setState({ handoff: current })
  }
  const close = (): void => {
    if (useHandoffStore.getState().handoff === current) {
      useHandoffStore.setState({ handoff: null })
    }
  }
  return { report, close }
}

export async function continueWithAgent(
  sessionFilePath: string,
  fromProvider: ProviderId,
  launcher: Pick<AgentLauncher, 'name' | 'command'>
): Promise<void> {
  const { report, close } = handoffReporter(fromProvider, launcher)
  report('reading')
  let plan
  try {
    plan = await window.api.history.continueWith({ sessionFilePath, agentCommand: launcher.command })
  } catch (error) {
    close()
    toast.error(friendlyErrorMessage(error, 'Could not prepare the handoff.'))
    return
  }
  report('opening')
  const paneId = openHandoffTerminal(plan.cwd, plan.command, `${launcher.name} (continued)`)
  if (paneId === null) {
    close()
    toast.error('Could not open a terminal for the agent.')
    return
  }
  report('sending', paneId)
  const result = await window.api.pty.typeWhenReady(paneId, plan.handoffText)
  if (result.isSent) {
    report('done', paneId, hiddenNote(plan.hiddenCount))
    setTimeout(close, DONE_SHOWN_MS)
  } else {
    close()
    toast.warning(result.message)
  }
  void useHistoryStore.getState().loadThreads()
}
