import { Bot } from 'lucide-react'
import { AgentIcon } from './AgentIcon'
import { useAgentLabel } from './useAgentLabel'
import './card.css'

interface AgentNameProps {
  command: string | null
  label?: string
  size?: number
  isStrong?: boolean
}

export function AgentName({ command, label, size = 14, isStrong = false }: AgentNameProps) {
  const agentLabel = useAgentLabel()
  return (
    <span className={isStrong ? 'agent-name agent-name-strong' : 'agent-name'}>
      {command === null ? <Bot size={size} /> : <AgentIcon command={command} size={size} />}
      <span className="agent-name-text">{label ?? agentLabel(command)}</span>
    </span>
  )
}
