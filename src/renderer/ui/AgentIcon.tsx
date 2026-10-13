import { Bot } from 'lucide-react'
import { programOf, providerOfCommand } from '../../shared/agentLaunchers'
import { AGENT_ICON_BY_COMMAND, AGENT_ICON_PATHS } from './agentMarks'
import { ProviderMark } from './ProviderMark'

export function AgentIcon({ command, size = 14 }: { command: string; size?: number }) {
  const provider = providerOfCommand(command)
  if (provider !== null) {
    return <ProviderMark provider={provider} size={size} />
  }

  const iconPath = AGENT_ICON_PATHS[AGENT_ICON_BY_COMMAND[programOf(command).toLowerCase()]]
  if (iconPath === undefined) {
    return <Bot size={size} />
  }
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" fillRule="evenodd" aria-hidden="true">
      <path d={iconPath} />
    </svg>
  )
}
