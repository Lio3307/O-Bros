import { Play, Search, Trash2, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { formatBytes } from '../../../shared/format'
import { describeSessionDelete } from '../../../shared/sessionDeleteMessage'
import { groupByDay, type DayGroup } from '../../../shared/time'
import type { SessionSearchHit, SessionSummary } from '../../../shared/types'
import { askToConfirm } from '../../state/confirmStore'
import { useHistoryStore } from '../../state/historyStore'
import { resumeSession } from '../../state/openTerminal'
import { PanelHeader } from '../../ui/PanelHeader'
import { ProviderMark } from '../../ui/ProviderMark'
import { ContinueButton } from './ContinueButton'
import { SessionTitle } from './SessionTitle'
import { ThreadChip } from './ThreadChip'
import './history.css'
import './historyFilter.css'
import { Button } from '../../ui/Button'
import { Chip } from '../../ui/Chip'
import { LoadingText } from '../../ui/LoadingText'

const dayGroupOrder: DayGroup[] = ['Today', 'Yesterday', 'Earlier']

function groupSessions(sessions: SessionSummary[], now: number): Record<DayGroup, SessionSummary[]> {
  const groups: Record<DayGroup, SessionSummary[]> = { Today: [], Yesterday: [], Earlier: [] }
  for (const session of sessions) {
    groups[groupByDay(session.lastActiveAt, now)].push(session)
  }
  return groups
}

async function removeAfterConfirm(sessions: SessionSummary[]): Promise<void> {
  const totalBytes = sessions.reduce((total, session) => total + session.sizeBytes, 0)
  const { deletePermanently, remove } = useHistoryStore.getState()
  const isConfirmed = await askToConfirm(describeSessionDelete(sessions.length, totalBytes, deletePermanently))
  if (isConfirmed) {
    await remove(sessions.map((session) => session.filePath))
  }
}

function SessionItem({ session, isSelected }: { session: SessionSummary | SessionSearchHit; isSelected: boolean }) {
  const select = useHistoryStore((state) => state.select)

  return (
    <div className="session-item">
      <button
        type="button"
        className={isSelected ? 'session-row session-row-selected' : 'session-row'}
        onClick={() => select(session.filePath)}
      >
        <span className="session-title">
          <SessionTitle sessionId={session.sessionId} title={session.title} />
        </span>
        <ThreadChip sessionId={session.sessionId} />
        {session.teamMemberName !== null && (
          <Chip title="A wot team member had this conversation">Team member · {session.teamMemberName}</Chip>
        )}
        {'snippet' in session && <span className="session-snippet">{session.snippet}</span>}
        <span className="session-meta">
          <ProviderMark provider={session.provider} size={12} /> {formatBytes(session.sizeBytes)} ·{' '}
          {session.projectPath ?? 'Unknown folder'}
        </span>
      </button>
      <div className="session-actions">
        <ContinueButton session={session} />
        <button
          type="button"
          className="icon-button icon-button-small hover-positive"
          title="Resume this session in a terminal"
          onClick={() => resumeSession(session)}
        >
          <Play size={14} />
        </button>
        <button
          type="button"
          className="icon-button icon-button-small hover-danger"
          title="Delete this session"
          onClick={() => removeAfterConfirm([session])}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

interface TeamFilterProps {
  visibleSessions: SessionSummary[]
  hasTeamChats: boolean
  isTeamOnly: boolean
  onTeamOnlyChange: (isTeamOnly: boolean) => void
}

function TeamFilter({ visibleSessions, hasTeamChats, isTeamOnly, onTeamOnlyChange }: TeamFilterProps) {
  if (!hasTeamChats && !isTeamOnly) {
    return null
  }

  return (
    <div className="history-filter">
      <label className="history-team-toggle" title="Show only conversations of wot team members">
        <input type="checkbox" checked={isTeamOnly} onChange={(event) => onTeamOnlyChange(event.target.checked)} />
        Team only
      </label>
      {isTeamOnly && visibleSessions.length > 0 && (
        <Button
          variant="remove"
          className="history-delete-all"
          title="Delete every team member conversation shown below"
          onClick={() => removeAfterConfirm(visibleSessions)}>
          <Trash2 size={14} /> Delete {visibleSessions.length}
        </Button>
      )}
    </div>
  )
}

function SearchBox() {
  const [query, setQuery] = useState('')
  const isSearching = useHistoryStore((state) => state.isSearching)
  const search = useHistoryStore((state) => state.search)
  const clearSearch = useHistoryStore((state) => state.clearSearch)

  function clear(): void {
    setQuery('')
    clearSearch()
  }

  return (
    <label className="find-field">
      <Search size={14} />
      <input
        placeholder="Search inside conversations, then press Enter"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value)
          if (event.target.value.trim() === '') {
            clearSearch()
          }
        }}
        onKeyDown={(event) => event.key === 'Enter' && void search(query)}
      />
      {isSearching && <LoadingText text="Searching…" size={12} />}
      {query !== '' && !isSearching && (
        <Button variant="icon" title="Clear the search" onClick={clear}>
          <X size={14} />
        </Button>
      )}
    </label>
  )
}

function SearchResults({ hits, selectedFilePath }: { hits: SessionSearchHit[]; selectedFilePath: string | null }) {
  const isSearching = useHistoryStore((state) => state.isSearching)
  if (hits.length === 0 && !isSearching) {
    return <p className="panel-empty">No conversation contains that text.</p>
  }
  return (
    <section>
      <h3 className="section-label">{hits.length} found</h3>
      {hits.map((hit) => (
        <SessionItem key={hit.filePath} session={hit} isSelected={hit.filePath === selectedFilePath} />
      ))}
    </section>
  )
}

export function HistoryPanel() {
  const sessions = useHistoryStore((state) => state.sessions)
  const selectedFilePath = useHistoryStore((state) => state.selectedFilePath)
  const load = useHistoryStore((state) => state.load)
  const searchHits = useHistoryStore((state) => state.searchHits)
  const [isTeamOnly, setIsTeamOnly] = useState(false)

  useEffect(() => {
    void load()
  }, [load])

  const visibleSessions = isTeamOnly ? sessions.filter((session) => session.teamMemberName !== null) : sessions
  const hasTeamChats = sessions.some((session) => session.teamMemberName !== null)
  const groups = groupSessions(visibleSessions, Date.now())
  const emptyText = isTeamOnly
    ? 'No team member conversations here.'
    : 'No sessions found yet. History shows Claude and Codex conversations, the formats O-BROS can read; other agents keep their history in their own folders (Settings → Storage and memory).'

  return (
    <div className="panel-content">
      <PanelHeader title="History" />
      <SearchBox />
      {searchHits !== null && <SearchResults hits={searchHits} selectedFilePath={selectedFilePath} />}
      {searchHits === null && (
        <TeamFilter
          visibleSessions={visibleSessions}
          hasTeamChats={hasTeamChats}
          isTeamOnly={isTeamOnly}
          onTeamOnlyChange={setIsTeamOnly}
        />
      )}
      {searchHits === null && visibleSessions.length === 0 && <p className="panel-empty">{emptyText}</p>}
      {searchHits === null &&
        dayGroupOrder.map((group) =>
          groups[group].length === 0 ? null : (
            <section key={group}>
              <h3 className="section-label">{group}</h3>
              {groups[group].map((session) => (
                <SessionItem
                  key={session.filePath}
                  session={session}
                  isSelected={session.filePath === selectedFilePath}
                />
              ))}
            </section>
          )
        )}
    </div>
  )
}
