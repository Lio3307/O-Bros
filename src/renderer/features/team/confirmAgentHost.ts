import { agentGitVerdict, BLOCKED_HOST_BY_POLICY_REASON } from '../../../shared/agentGitPolicy'
import type { AgentHostAnswer, AgentHostRequest } from '../../../shared/types'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import type { ConfirmOptions } from '../../state/confirmStore'
import { useTerminalSettingsStore } from '../../state/terminalSettingsStore'
import { ANSWER_WINDOW_NOTE, askInTime, isTeamMember, REFUSED_REASON, whoAsks } from './agentQuestion'

const TOKEN_WORD = 'token'
const TOKEN_WARNING = 'This shows your sign-in token to the agent. Anyone with the token can act as you.'

function questionFor(request: AgentHostRequest, action: string): ConfirmOptions {
  const lines = [
    `${whoAsks(request.paneId, true)} wants to run:`,
    '',
    request.command,
    '',
    `in ${request.cwd}`,
    ...(action.includes(TOKEN_WORD) ? ['', TOKEN_WARNING] : []),
    '',
    ANSWER_WINDOW_NOTE
  ]
  return { title: `Allow it to run ${action}?`, message: lines.join('\n'), confirmLabel: 'Allow' }
}

export async function confirmAgentHost(request: AgentHostRequest): Promise<AgentHostAnswer> {
  const keepCredits = useAgentCommitStore.getState().allowAgentCoAuthors
  const action = request.action
  const verdict = agentGitVerdict(
    { fromAgent: true, changesHistory: true, isTeamMember: isTeamMember(request.paneId), hasWarnings: false },
    useTerminalSettingsStore.getState().agentHostPolicy
  )
  if (verdict === 'block') {
    return { allowed: false, reason: BLOCKED_HOST_BY_POLICY_REASON, keepCredits }
  }
  const notificationTitle = `${whoAsks(request.paneId, true)} wants to run ${action}`
  if (verdict === 'ask' && !(await askInTime(questionFor(request, action), notificationTitle))) {
    return { allowed: false, reason: REFUSED_REASON, keepCredits }
  }
  return { allowed: true, reason: '', keepCredits }
}
