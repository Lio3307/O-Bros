import { Plus, RotateCcw } from 'lucide-react'
import { useState } from 'react'
import { MAX_SHOWN_AGENTS } from '../../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { CommandSearch } from './agents/CommandSearch'
import { CustomAgentForm } from './agents/CustomAgentForm'
import { FoundAgents } from './agents/FoundAgents'
import { LauncherRow } from './agents/LauncherRow'
import { UsageVisibility } from './agents/UsageVisibility'
import { useAgentCatalog } from './agents/useAgentCatalog'
import './settings.css'
import './settingsControls.css'

export function AgentsPage() {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const shownIds = useAgentLaunchersStore((state) => state.shownIds)
  const reset = useAgentLaunchersStore((state) => state.reset)
  const { commands, registry, scan } = useAgentCatalog()
  const [isCustomFormOpen, setIsCustomFormOpen] = useState(false)
  const canShowMore = shownIds.length < MAX_SHOWN_AGENTS

  return (
    <SettingsPageLayout
      title="Agents"
      description={
        <>
          Keep the agent CLIs you use here, and tick up to {MAX_SHOWN_AGENTS} to show as buttons at the top of
          Projects. A button runs its command in a new terminal in the selected folder. Claude and Codex also use
          the account you picked.
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={reset}>
            <RotateCcw size={14} /> Clear
          </Button>
          <Button variant="outline" onClick={() => setIsCustomFormOpen(true)}>
            <Plus size={14} /> Custom agent
          </Button>
        </>
      }
    >
      {isCustomFormOpen && <CustomAgentForm onDone={() => setIsCustomFormOpen(false)} />}

      <div className="table">
        {launchers.length === 0 && (
          <p className="panel-empty">No agents yet. Add one from the lists below, or add a custom agent.</p>
        )}
        {launchers.map((launcher) => (
          <LauncherRow
            key={launcher.id}
            launcher={launcher}
            isShown={shownIds.includes(launcher.id)}
            canShowMore={canShowMore}
          />
        ))}
      </div>

      <UsageVisibility />
      <FoundAgents commands={commands} registry={registry} scan={scan} />
      <CommandSearch commands={commands} />
    </SettingsPageLayout>
  )
}
