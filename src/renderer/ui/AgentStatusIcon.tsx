import type { ReactNode } from 'react'
import type { AgentStatus } from '../../shared/agentStatus'
import { AgentIcon } from './AgentIcon'
import { cn } from './cn'
import './agentStatusIcon.css'

export const AGENT_STATUS_TEXT: Record<AgentStatus, string> = {
  starting: 'is starting',
  working: 'is working',
  asking: 'is asking you a question',
  done: 'is done, your turn',
  ready: 'is ready for a task'
}

const CHECK_MARK = (
  <svg viewBox="0 0 10 10" aria-hidden="true">
    <path className="agent-status-check" d="M2.4 5.2 4.3 7 7.7 3.3" />
  </svg>
)

const STATUS_BADGES: Record<AgentStatus, ReactNode> = {
  starting: null,
  working: null,
  asking: (
    <span key="asking" className="agent-status-badge" aria-hidden="true">
      ?
    </span>
  ),
  done: (
    <span key="done" className="agent-status-badge" aria-hidden="true">
      {CHECK_MARK}
    </span>
  ),
  ready: null
}

interface AgentStatusIconProps {
  command: string
  status: AgentStatus | null
  label: string
  size?: number
  isStopped?: boolean
  isUnseen?: boolean
}

export function AgentStatusIcon({ command, status, label, size = 14, isStopped = false, isUnseen = false }: AgentStatusIconProps) {
  const title = isStopped ? `${label} is not running here any more` : `${label} ${AGENT_STATUS_TEXT[status ?? 'ready']}`
  return (
    <span
      className={cn(
        'agent-status-icon',
        status !== null && !isStopped && `agent-status-${status}`,
        isStopped && 'agent-status-stopped',
        isUnseen && status === 'done' && 'agent-status-unseen'
      )}
      role="img"
      aria-label={title}
      title={title}
    >
      <span className="agent-status-logo">
        <AgentIcon command={command} size={size} />
      </span>
      {!isStopped && status !== null && STATUS_BADGES[status]}
    </span>
  )
}
