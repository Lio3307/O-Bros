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
  const installed = buildAgentSuggestions(registry, commands ?? [], [])
  const suggestions = buildAgentSuggestions(registry, commands ?? [], addedCommands)
  const inListCount = installed.length - suggestions.length
  const catalogName = registry.length > 0 ? 'the ACP Registry and O-BROS’s own list' : 'O-BROS’s own list (the ACP Registry could not be reached)'
  const summary =
    commands === null
      ? 'Looking for agents…'
      : `${installed.length} agent${installed.length === 1 ? '' : 's'} on this computer, ${inListCount} already in your list. The rest are below.`

  return (
    <SettingsSection
      title="Found on this computer"
      description={`${summary} O-BROS checks your PATH for the agents in ${catalogName}. A second name for the same program, such as opencode2 or kilocode, counts once.`}
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
