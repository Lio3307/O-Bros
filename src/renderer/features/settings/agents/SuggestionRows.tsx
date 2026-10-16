import { Plus } from 'lucide-react'
import type { AgentSuggestion } from '../../../../shared/acpRegistry'
import { shortAgentName } from '../../../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../../../state/agentLaunchersStore'
import { AgentIcon } from '../../../ui/AgentIcon'
import { AgentUsageNote } from '../../../ui/AgentUsageNote'
import { AgentStatusBadge } from '../../../ui/AgentStatusBadge'
import { Button } from '../../../ui/Button'

export function SuggestionRows({ suggestions }: { suggestions: AgentSuggestion[] }) {
  const add = useAgentLaunchersStore((state) => state.add)

  return (
    <div className="table">
      {suggestions.map((suggestion) => (
        <div key={suggestion.command} className="table-row">
          <div className="cell cell-account">
            <span className="agent-name">
              <AgentIcon command={suggestion.command} /> {suggestion.name}
            </span>
            <span className="muted mono">{suggestion.command}</span>
          </div>
          <span className="agent-status-cell">
            <AgentStatusBadge command={suggestion.command} />
            <AgentUsageNote command={suggestion.command} />
          </span>
          <Button variant="outline" onClick={() => add(shortAgentName(suggestion.name), suggestion.command)}>
            <Plus size={14} /> Add
          </Button>
        </div>
      ))}
    </div>
  )
}
