import type { AgentGitAnswer, AgentGitRequest } from '../../../shared/types'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import { useConfirmStore, type ConfirmOptions } from '../../state/confirmStore'
import { useTeamStore } from '../../state/teamStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { ensureCommitIdentity } from './commitIdentityPrompt'

const ANSWER_WITHIN_MS = 100_000
const REFUSED_REASON = 'The user said no, or did not answer within 100 seconds.'
const NO_IDENTITY_REASON = 'The user did not set a name and email for commits made by agents.'

function isTeamMember(paneId: string): boolean {
  return useTeamStore.getState().members.some((member) => member.id === paneId)
}

function whoAsks(request: AgentGitRequest): string {
  const member = useTeamStore.getState().members.find((candidate) => candidate.id === request.paneId)
  if (member !== undefined) {
    return `Team member "${member.name}" (${member.agentName})`
  }
  for (const tab of useWorkspaceStore.getState().tabs.filter(isTerminalTab)) {
    const pane = tab.panes[request.paneId]
    if (pane !== undefined) {
      return request.fromAgent ? `The agent in "${pane.title}"` : `A command in "${pane.title}"`
    }
  }
  return request.fromAgent ? 'An agent' : 'A command'
}

function notifyIfAway(title: string): void {
  if (document.hasFocus()) {
    return
  }
  try {
    const notification = new Notification(title, { body: 'Open O-BROS to allow or refuse it.' })
    notification.onclick = () => window.focus()
  } catch {
    return
  }
}

function questionFor(request: AgentGitRequest): ConfirmOptions {
  const who = whoAsks(request)
  const hasWarnings = request.warnings.length > 0
  const lines = [
    `${who} wants to run:`,
    '',
    request.command,
    '',
    `in ${request.cwd}`,
    ...(hasWarnings ? ['', ...request.warnings] : []),
    '',
    'If you do not answer within 100 seconds, the answer is no.'
  ]
  return {
    title: hasWarnings ? `Allow "${request.action}" with an agent in it?` : `Allow it to ${request.action}?`,
    message: lines.join('\n'),
    confirmLabel: hasWarnings ? 'Allow anyway' : 'Allow'
  }
}

async function askUser(request: AgentGitRequest): Promise<boolean> {
  const options = questionFor(request)
  notifyIfAway(`${whoAsks(request)} wants to ${request.action}`)

  let timer: ReturnType<typeof setTimeout> | null = null
  const timedOut = new Promise<boolean>((resolve) => {
    timer = setTimeout(() => {
      if (useConfirmStore.getState().options === options) {
        useConfirmStore.getState().answer(false)
      }
      resolve(false)
    }, ANSWER_WITHIN_MS)
  })
  const answer = await Promise.race([useConfirmStore.getState().ask(options), timedOut])
  if (timer !== null) {
    clearTimeout(timer)
  }
  return answer
}

function mustAsk(request: AgentGitRequest): boolean {
  if (request.warnings.length > 0) {
    return true
  }
  const wantsQuestion = isTeamMember(request.paneId) || useTerminalSettingsStore.getState().askBeforeAgentGit
  return request.fromAgent && request.isGuarded && wantsQuestion
}

export async function confirmAgentGit(request: AgentGitRequest): Promise<AgentGitAnswer> {
  const keepCoAuthors = useAgentCommitStore.getState().allowAgentCoAuthors
  if (mustAsk(request) && !(await askUser(request))) {
    return { allowed: false, reason: REFUSED_REASON, identity: null, keepCoAuthors }
  }
  if (!request.fromAgent || !request.createsCommit) {
    return { allowed: true, reason: '', identity: null, keepCoAuthors }
  }
  const identity = await ensureCommitIdentity()
  if (identity === null) {
    return { allowed: false, reason: NO_IDENTITY_REASON, identity: null, keepCoAuthors }
  }
  return { allowed: true, reason: '', identity, keepCoAuthors }
}
