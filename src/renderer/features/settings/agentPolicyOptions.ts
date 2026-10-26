import type { AgentGitPolicy } from '../../../shared/agentGitPolicy'

export const AGENT_POLICY_OPTIONS: { value: AgentGitPolicy; label: string }[] = [
  { value: 'block', label: 'Never allow' },
  { value: 'ask', label: 'Ask me' },
  { value: 'allow', label: 'Allow' }
]

export const AGENT_POLICY_NOTES: Record<AgentGitPolicy, string> = {
  block: 'Agents are refused right away and told that you do it yourself. Nothing is asked.',
  ask: 'O-BROS pauses the agent and asks you. No answer in 100 seconds means no.',
  allow: 'Agents may do it. Team members are still asked about.'
}
