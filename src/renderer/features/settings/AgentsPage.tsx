import { Plus, RotateCcw, Search, Trash2 } from 'lucide-react'
import { useEffect, useState } from 'react'
import { KNOWN_AGENTS, MAX_SHOWN_AGENTS } from '../../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useUsageVisibilityStore } from '../../state/usageVisibilityStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { ProviderMark } from '../../ui/ProviderMark'
import type { ProviderId } from '../../../shared/types'
import './settings.css'
import './settingsControls.css'

const MAX_SEARCH_RESULTS = 12

const USAGE_PROVIDERS: { id: ProviderId; name: string }[] = [
  { id: 'claude', name: 'Claude' },
  { id: 'codex', name: 'Codex' }
]

function usePathCommands(): { commands: string[] | null; scan: () => void } {
  const [commands, setCommands] = useState<string[] | null>(null)

  function scan(): void {
    setCommands(null)
    window.api.agents
      .listCommands()
      .then(setCommands)
      .catch(() => setCommands([]))
  }

  useEffect(scan, [])
  return { commands, scan }
}

interface Suggestion {
  name: string
  command: string
}

function SuggestionRows({ suggestions }: { suggestions: Suggestion[] }) {
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
          <button type="button" className="button-outline" onClick={() => add(suggestion.name, suggestion.command)}>
            <Plus size={14} /> Add
          </button>
        </div>
      ))}
    </div>
  )
}

function UsageVisibility() {
  const hiddenProviders = useUsageVisibilityStore((state) => state.hiddenProviders)
  const toggle = useUsageVisibilityStore((state) => state.toggle)

  return (
    <section className="settings-section">
      <h2 className="settings-subtitle">Usage in the status bar</h2>
      <p className="muted">
        Only Claude and Codex report how much of your plan you have used, so only they can show a usage figure. Other
        agents never show one.
      </p>
      {USAGE_PROVIDERS.map((provider) => (
        <label key={provider.id} className="toggle-row">
          <input
            type="checkbox"
            checked={!hiddenProviders.includes(provider.id)}
            onChange={() => toggle(provider.id)}
          />
          <ProviderMark provider={provider.id} />
          <span>Show {provider.name} usage</span>
        </label>
      ))}
    </section>
  )
}

function FoundAgents({ commands, scan }: { commands: string[] | null; scan: () => void }) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const addedCommands = launchers.map((launcher) => launcher.command.trim())
  const suggestions = KNOWN_AGENTS.filter(
    (agent) => commands?.includes(agent.command) === true && !addedCommands.includes(agent.command)
  )

  return (
    <section className="settings-section">
      <div className="accounts-heading">
        <div>
          <h2 className="settings-subtitle">Found on this computer</h2>
          <p className="muted">Well-known agents that o-bros found in your PATH and that are not in your list yet.</p>
        </div>
        <button type="button" className="button-outline" onClick={scan}>
          <Search size={14} /> Scan again
        </button>
      </div>
      {commands === null && <p className="panel-empty">Looking…</p>}
      {commands !== null && suggestions.length === 0 && (
        <p className="panel-empty">Nothing new found. Use the search below for any other command.</p>
      )}
      {suggestions.length > 0 && <SuggestionRows suggestions={suggestions} />}
    </section>
  )
}

function CommandSearch({ commands }: { commands: string[] | null }) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const [query, setQuery] = useState('')

  const addedCommands = launchers.map((launcher) => launcher.command.trim())
  const lowerQuery = query.trim().toLowerCase()
  const matches =
    commands === null || lowerQuery === ''
      ? []
      : commands
          .filter((command) => command.includes(lowerQuery) && !addedCommands.includes(command))
          .slice(0, MAX_SEARCH_RESULTS)

  return (
    <section className="settings-section">
      <h2 className="settings-subtitle">Find any command</h2>
      <p className="muted">
        Type part of the name of an agent CLI you have installed. o-bros searches every program in your PATH
        {commands === null ? '' : ` (${commands.length.toLocaleString()} found)`}.
      </p>
      <input
        className="field field-search"
        placeholder="For example: crush, kilo, forge"
        spellCheck={false}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
      />
      {lowerQuery !== '' && commands !== null && matches.length === 0 && (
        <p className="panel-empty">No program in your PATH matches that.</p>
      )}
      {matches.length > 0 && <SuggestionRows suggestions={matches.map((command) => ({ name: command, command }))} />}
    </section>
  )
}

export function AgentsPage() {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const shownIds = useAgentLaunchersStore((state) => state.shownIds)
  const add = useAgentLaunchersStore((state) => state.add)
  const update = useAgentLaunchersStore((state) => state.update)
  const remove = useAgentLaunchersStore((state) => state.remove)
  const toggleShown = useAgentLaunchersStore((state) => state.toggleShown)
  const reset = useAgentLaunchersStore((state) => state.reset)
  const { commands, scan } = usePathCommands()
  const canShowMore = shownIds.length < MAX_SHOWN_AGENTS

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1 className="settings-title">Agents</h1>
          <p className="muted">
            Keep the agent CLIs you use here, and tick up to {MAX_SHOWN_AGENTS} to show as buttons at the top of
            Projects. A button runs its command in a new terminal in the selected folder. Claude and Codex also use
            the account you picked.
          </p>
        </div>
        <div className="settings-header-actions">
          <button type="button" className="button-outline" onClick={reset}>
            <RotateCcw size={14} /> Clear
          </button>
          <button type="button" className="button-outline" onClick={() => add('', '')}>
            <Plus size={14} /> Add by hand
          </button>
        </div>
      </header>

      <div className="table">
        {launchers.length === 0 && <p className="panel-empty">No agents yet. Add one from the lists below, or by hand.</p>}
        {launchers.map((launcher) => {
          const isShown = shownIds.includes(launcher.id)
          const hint = isShown || canShowMore ? 'Show as a button in Projects' : 'Two buttons fit. Hide another first.'
          return (
            <div key={launcher.id} className="table-row">
              <span className="agent-icon">
                <AgentIcon command={launcher.command} />
              </span>
              <label className="agent-show" title={hint}>
                <input
                  type="checkbox"
                  checked={isShown}
                  disabled={!isShown && !canShowMore}
                  onChange={() => toggleShown(launcher.id)}
                />
                Show
              </label>
              <input
                className="field field-prefix"
                placeholder="Button name"
                value={launcher.name}
                onChange={(event) => update(launcher.id, { name: event.target.value })}
              />
              <input
                className="field field-command"
                placeholder="Command, for example opencode"
                spellCheck={false}
                value={launcher.command}
                onChange={(event) => update(launcher.id, { command: event.target.value })}
              />
              <button type="button" className="button-remove" title="Remove" onClick={() => remove(launcher.id)}>
                <Trash2 size={14} />
              </button>
            </div>
          )
        })}
      </div>

      <UsageVisibility />
      <FoundAgents commands={commands} scan={scan} />
      <CommandSearch commands={commands} />
    </div>
  )
}
