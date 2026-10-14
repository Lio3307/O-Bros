import { useState } from 'react'
import { useAgentLaunchersStore } from '../../../state/agentLaunchersStore'
import { SettingsSection } from '../../../ui/SettingsSection'
import { SuggestionRows } from './SuggestionRows'

const MAX_SEARCH_RESULTS = 12

export function CommandSearch({ commands }: { commands: string[] | null }) {
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
  const foundCount = commands === null ? '' : ` (${commands.length.toLocaleString()} found)`

  return (
    <SettingsSection
      title="Find any command"
      description={`Type part of the name of an agent CLI you have installed. o-bros searches every program in your PATH${foundCount}.`}
    >
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
    </SettingsSection>
  )
}
