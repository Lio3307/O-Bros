import { Link2 } from 'lucide-react'
import { useHistoryStore } from '../../state/historyStore'
import { Chip } from '../../ui/Chip'

export function ThreadChip({ sessionId }: { sessionId: string }) {
  const thread = useHistoryStore((state) => state.threads.find((candidate) => candidate.parts.some((part) => part.sessionId === sessionId)))
  if (thread === undefined) {
    return null
  }
  const position = thread.parts.findIndex((part) => part.sessionId === sessionId) + 1
  const chain = thread.parts.map((part) => part.agentName).join(' → ')
  return (
    <Chip tone="info" icon={<Link2 size={12} />} title={`Continued across agents: ${chain}. This is part ${position} of ${thread.parts.length}.`}>
      {chain}
    </Chip>
  )
}
