import { accountToRef } from '../../shared/accounts'
import { resumeCommandFor } from '../../shared/resumeCommand'
import type { ProviderId, SessionSummary } from '../../shared/types'
import { selectActiveAccount, useAccountsStore } from './accountsStore'
import { useLayoutStore } from './layoutStore'
import { useProjectsStore } from './projectsStore'
import { useWorkspaceStore } from './workspaceStore'

const startCommandByProvider: Record<ProviderId, string> = {
  claude: 'claude',
  codex: 'codex'
}

export function openTerminal(provider: ProviderId | null): void {
  const cwd = useProjectsStore.getState().activeProjectPath
  const account = provider === null ? null : selectActiveAccount(useAccountsStore.getState(), provider)

  useWorkspaceStore.getState().openTerminalTab({
    cwd,
    account: accountToRef(account),
    startCommand: provider === null ? undefined : startCommandByProvider[provider]
  })
  useLayoutStore.getState().showSection('projects')
}

export async function openAccountSignInTerminal(
  provider: ProviderId,
  accountName: string,
  signInCommand: string
): Promise<string> {
  const configDir = await window.api.accounts.createFolder(provider, accountName)

  useWorkspaceStore.getState().openTerminalTab({
    cwd: useProjectsStore.getState().activeProjectPath,
    account: { provider, configDir },
    startCommand: signInCommand
  })
  useLayoutStore.getState().showSection('projects')
  await useAccountsStore.getState().rescan()
  return configDir
}

export function openTerminalIn(cwd: string): void {
  useWorkspaceStore.getState().openTerminalTab({ cwd, account: null })
  useLayoutStore.getState().showSection('projects')
}

export function runInTerminal(cwd: string, command: string, title: string): void {
  useWorkspaceStore.getState().openTerminalTab({ cwd, account: null, startCommand: command, title })
  useLayoutStore.getState().showSection('projects')
}

export function resumeSession(session: SessionSummary): void {
  useWorkspaceStore.getState().openTerminalTab({
    cwd: session.projectPath,
    account: session.account,
    startCommand: resumeCommandFor(session.provider, session.sessionId),
    title: 'Resume ' + session.title.slice(0, 24)
  })
  useLayoutStore.getState().showSection('projects')
}
