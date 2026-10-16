import { Search } from 'lucide-react'
import { buildAgentSuggestions } from '../../../../shared/acpRegistry'
import { useAgentLaunchersStore } from '../../../state/agentLaunchersStore'
import { Button } from '../../../ui/Button'
import { SettingsSection } from '../../../ui/SettingsSection'
import { SuggestionRows } from './SuggestionRows'
import type { AgentCatalog } from './useAgentCatalog'
import { LoadingText } from '../../../ui/LoadingText'

export function FoundAgents({ commands, registry, scan }: AgentCatalog) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const addedCommands = launchers.map((launcher) => launcher.command.trim())
  const suggestions = buildAgentSuggestions(registry, commands ?? [], addedCommands)
  const catalogName = registry.length > 0 ? 'ACP Registry' : 'built-in list (the ACP Registry could not be reached)'

  return (
    <SettingsSection
      title="Found on this computer"
      description={`Agents from the ${catalogName} that o-bros found in your PATH and that are not in your list yet.`}
      actions={
        <Button variant="outline" onClick={scan}>
          <Search size={14} /> Scan again
        </Button>
      }
    >
      {commands === null && <p className="panel-empty"><LoadingText text="Looking for agents on this computer…" /></p>}
      {commands !== null && suggestions.length === 0 && (
        <p className="panel-empty">Nothing new found. Use the search below for any other command.</p>
      )}
      {suggestions.length > 0 && <SuggestionRows suggestions={suggestions} />}
    </SettingsSection>
  )
}
