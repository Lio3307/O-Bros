import { accountToRef } from '../../shared/accounts'
import { providerOfCommand, shortAgentName, type AgentLauncher } from '../../shared/agentLaunchers'
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

const AGENT_NAME_BY_PROVIDER: Record<ProviderId, string> = {
  claude: 'Claude',
  codex: 'Codex'
}

async function folderForAgent(agentName: string): Promise<string | null> {
  const selected = useProjectsStore.getState().activeProjectPath
  if (selected !== null) {
    return selected
  }
  return useProjectsStore.getState().addRoot(`Choose a project folder for ${agentName}`)
}

function openIn(cwd: string | null, startCommand: string | undefined, title?: string): void {
  const provider = startCommand === undefined ? null : providerOfCommand(startCommand)
  const account = provider === null ? null : selectActiveAccount(useAccountsStore.getState(), provider)

  useWorkspaceStore.getState().openTerminalTab({ cwd, account: accountToRef(account), startCommand, title })
  useLayoutStore.getState().showSection('projects')
}

async function openAgentIn(agentName: string, startCommand: string): Promise<void> {
  const cwd = await folderForAgent(agentName)
  if (cwd !== null) {
    openIn(cwd, startCommand, agentName)
  }
}

export async function openTerminal(provider: ProviderId | null): Promise<void> {
  if (provider === null) {
    openIn(useProjectsStore.getState().activeProjectPath, undefined)
    return
  }
  await openAgentIn(AGENT_NAME_BY_PROVIDER[provider], startCommandByProvider[provider])
}

export async function openAgent(launcher: AgentLauncher): Promise<void> {
  await openAgentIn(shortAgentName(launcher.name), launcher.command.trim())
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

export function runInTerminal(cwd: string | null, command: string, title: string): void {
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
