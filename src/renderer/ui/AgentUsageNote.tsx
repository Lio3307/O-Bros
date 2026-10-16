import { programOf } from '../../shared/agentLaunchers'
import { usageSupportFor } from '../../shared/usageSupport'
import { useUsageStore } from '../state/usageStore'
import './agentUsageNote.css'

export function AgentUsageNote({ command }: { command: string }) {
  const facts = useUsageStore((state) => state.facts)
  if (facts === null || command.trim() === '') {
    return null
  }
  const support = usageSupportFor(programOf(command), facts)
  return (
    <span className={`agent-usage-note agent-usage-note-${support.kind}`} title={support.detail}>
      {support.label}
    </span>
  )
}
