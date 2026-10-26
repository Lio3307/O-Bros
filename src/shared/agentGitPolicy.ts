export type AgentGitPolicy = 'block' | 'ask' | 'allow'
export type AgentGitVerdict = 'block' | 'ask' | 'allow'

export const AGENT_GIT_POLICIES: AgentGitPolicy[] = ['block', 'ask', 'allow']
export const DEFAULT_AGENT_GIT_POLICY: AgentGitPolicy = 'block'
export const DEFAULT_AGENT_HOST_POLICY: AgentGitPolicy = 'ask'

export const BLOCKED_BY_POLICY_REASON =
  'The user does not let agents commit, push, or create, delete or rename branches or worktrees. Do not try another way. Tell the user what is ready so they can do it themselves.'
export const BLOCKED_HOST_BY_POLICY_REASON =
  'The user does not let agents change GitHub or GitLab with gh or glab, or show the sign-in token. Do not try another way. Tell the user the command so they can run it themselves.'

export interface AgentGitSituation {
  fromAgent: boolean
  changesHistory: boolean
  isTeamMember: boolean
  hasWarnings: boolean
}

export function readAgentGitPolicy(raw: string | null, fallback = DEFAULT_AGENT_GIT_POLICY): AgentGitPolicy {
  return AGENT_GIT_POLICIES.includes(raw as AgentGitPolicy) ? (raw as AgentGitPolicy) : fallback
}

export function agentGitVerdict(situation: AgentGitSituation, policy: AgentGitPolicy): AgentGitVerdict {
  if (!situation.fromAgent || !situation.changesHistory) {
    return situation.hasWarnings ? 'ask' : 'allow'
  }
  if (policy === 'block') {
    return 'block'
  }
  if (policy === 'ask' || situation.isTeamMember || situation.hasWarnings) {
    return 'ask'
  }
  return 'allow'
}
