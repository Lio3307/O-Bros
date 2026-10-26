import { agentGitVerdict, BLOCKED_BY_POLICY_REASON } from '../../../shared/agentGitPolicy'
import type { AgentGitAnswer, AgentGitRequest } from '../../../shared/types'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import type { ConfirmOptions } from '../../state/confirmStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { ANSWER_WINDOW_NOTE, askInTime, isTeamMember, REFUSED_REASON, whoAsks } from './agentQuestion'
import { ensureCommitIdentity } from './commitIdentityPrompt'

const NO_IDENTITY_REASON = 'The user did not set a name and email for commits made by agents.'

function questionFor(request: AgentGitRequest): ConfirmOptions {
  const who = whoAsks(request.paneId, request.fromAgent)
  const hasWarnings = request.warnings.length > 0
  const lines = [
    `${who} wants to run:`,
    '',
    request.command,
    '',
    `in ${request.cwd}`,
    ...(hasWarnings ? ['', ...request.warnings] : []),
    '',
    ANSWER_WINDOW_NOTE
  ]
  return {
    title: hasWarnings ? `Allow "${request.action}" with an agent in it?` : `Allow it to ${request.action}?`,
    message: lines.join('\n'),
    confirmLabel: hasWarnings ? 'Allow anyway' : 'Allow'
  }
}

export async function confirmAgentGit(request: AgentGitRequest): Promise<AgentGitAnswer> {
  const keepCoAuthors = useAgentCommitStore.getState().allowAgentCoAuthors
  const verdict = agentGitVerdict(
    {
      fromAgent: request.fromAgent,
      changesHistory: request.isGuarded || request.createsCommit,
      isTeamMember: isTeamMember(request.paneId),
      hasWarnings: request.warnings.length > 0
    },
    useTerminalSettingsStore.getState().agentGitPolicy
  )
  if (verdict === 'block') {
    return { allowed: false, reason: BLOCKED_BY_POLICY_REASON, identity: null, keepCoAuthors }
  }
  const notificationTitle = `${whoAsks(request.paneId, request.fromAgent)} wants to ${request.action}`
  if (verdict === 'ask' && !(await askInTime(questionFor(request), notificationTitle))) {
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
