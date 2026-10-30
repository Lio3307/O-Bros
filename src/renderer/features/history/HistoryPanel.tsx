import { Check, ListChecks, Play, Search, Trash2, X } from 'lucide-react'
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
import { cn } from '../../ui/cn'
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

function totalBytesOf(sessions: SessionSummary[]): number {
  return sessions.reduce((total, session) => total + session.sizeBytes, 0)
}

async function removeAfterConfirm(sessions: SessionSummary[], isEverything = false): Promise<boolean> {
  const { deletePermanently, remove } = useHistoryStore.getState()
  const isConfirmed = await askToConfirm(describeSessionDelete(sessions.length, totalBytesOf(sessions), deletePermanently, isEverything))
  if (isConfirmed) {
    await remove(sessions.map((session) => session.filePath))
  }
  return isConfirmed
}

interface Picking {
  isOn: boolean
  pickedPaths: string[]
  toggle: (filePath: string) => void
}

interface SessionItemProps {
  session: SessionSummary | SessionSearchHit
  isSelected: boolean
  picking: Picking
}

function SessionItem({ session, isSelected, picking }: SessionItemProps) {
  const select = useHistoryStore((state) => state.select)
  const isPicked = picking.pickedPaths.includes(session.filePath)
  const rowClass = picking.isOn
    ? cn('session-row session-row-picking', isPicked && 'session-row-picked')
    : cn('session-row', isSelected && 'session-row-selected')

  return (
    <div className="session-item">
      <button
        type="button"
        className={rowClass}
        aria-pressed={picking.isOn ? isPicked : undefined}
        onClick={() => (picking.isOn ? picking.toggle(session.filePath) : select(session.filePath))}
      >
        <span className="session-title">
          {picking.isOn && (
            <span className={cn('session-check', isPicked && 'session-check-on')} aria-hidden="true">
              {isPicked && <Check size={11} strokeWidth={3} />}
            </span>
          )}
          <span className="session-title-text">
            <SessionTitle sessionId={session.sessionId} title={session.title} />
          </span>
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
      {!picking.isOn && (
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
      )}
    </div>
  )
}

interface SelectionBarProps {
  shown: SessionSummary[]
  pickedPaths: string[]
  onPick: (filePaths: string[]) => void
  onDeleted: () => void
}

function SelectionBar({ shown, pickedPaths, onPick, onDeleted }: SelectionBarProps) {
  const picked = shown.filter((session) => pickedPaths.includes(session.filePath))
  const isEverything = shown.length > 0 && picked.length === shown.length
  const isSome = picked.length > 0 && !isEverything

  async function deletePicked(): Promise<void> {
    if (await removeAfterConfirm(picked, isEverything)) {
      onDeleted()
    }
  }

  return (
    <div className="history-select-bar">
      <label className="history-select-all">
        <input
          type="checkbox"
          checked={isEverything}
          ref={(input) => {
            if (input !== null) {
              input.indeterminate = isSome
            }
          }}
          onChange={() => onPick(isEverything ? [] : shown.map((session) => session.filePath))}
        />
        Select all ({shown.length})
      </label>
      <span className="history-select-count">
        {picked.length === 0 ? 'Nothing selected' : `${picked.length} selected · ${formatBytes(totalBytesOf(picked))}`}
      </span>
      <Button variant="remove" className="history-delete-picked" disabled={picked.length === 0} onClick={deletePicked}>
        <Trash2 size={14} /> {isEverything ? `Delete all ${picked.length}` : `Delete ${picked.length}`}
      </Button>
    </div>
  )
}

interface TeamFilterProps {
  hasTeamChats: boolean
  isTeamOnly: boolean
  onTeamOnlyChange: (isTeamOnly: boolean) => void
}

function TeamFilter({ hasTeamChats, isTeamOnly, onTeamOnlyChange }: TeamFilterProps) {
  if (!hasTeamChats && !isTeamOnly) {
    return null
  }

  return (
    <div className="history-filter">
      <label className="history-team-toggle" title="Show only conversations of wot team members">
        <input type="checkbox" role="switch" checked={isTeamOnly} onChange={(event) => onTeamOnlyChange(event.target.checked)} />
        Team only
      </label>
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

function SearchResults({ hits, selectedFilePath, picking }: { hits: SessionSearchHit[]; selectedFilePath: string | null; picking: Picking }) {
  const isSearching = useHistoryStore((state) => state.isSearching)
  if (hits.length === 0 && !isSearching) {
    return <p className="panel-empty">No conversation contains that text.</p>
  }
  return (
    <section>
      <h3 className="section-label">{hits.length} found</h3>
      {hits.map((hit) => (
        <SessionItem key={hit.filePath} session={hit} isSelected={hit.filePath === selectedFilePath} picking={picking} />
      ))}
    </section>
  )
}

export function HistoryPanel() {
  const sessions = useHistoryStore((state) => state.sessions)
  const selectedFilePath = useHistoryStore((state) => state.selectedFilePath)
  const load = useHistoryStore((state) => state.load)
  const searchHits = useHistoryStore((state) => state.searchHits)
  const hasLoaded = useHistoryStore((state) => state.hasLoaded)
  const [isTeamOnly, setIsTeamOnly] = useState(false)
  const [isPicking, setIsPicking] = useState(false)
  const [pickedPaths, setPickedPaths] = useState<string[]>([])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!isPicking) {
      return
    }
    const leaveOnEscape = (event: KeyboardEvent) => event.key === 'Escape' && stopPicking()
    window.addEventListener('keydown', leaveOnEscape)
    return () => window.removeEventListener('keydown', leaveOnEscape)
  }, [isPicking])

  function stopPicking(): void {
    setIsPicking(false)
    setPickedPaths([])
  }

  const picking: Picking = {
    isOn: isPicking,
    pickedPaths,
    toggle: (filePath) => setPickedPaths((paths) => (paths.includes(filePath) ? paths.filter((path) => path !== filePath) : [...paths, filePath]))
  }

  const visibleSessions = isTeamOnly ? sessions.filter((session) => session.teamMemberName !== null) : sessions
  const hasTeamChats = sessions.some((session) => session.teamMemberName !== null)
  const groups = groupSessions(visibleSessions, Date.now())
  const shownSessions: SessionSummary[] = searchHits ?? visibleSessions
  const emptyText = isTeamOnly
    ? 'No team member conversations here.'
    : 'No sessions found yet. History shows Claude and Codex conversations, the formats O-BROS can read; other agents keep their history in their own folders (Settings → Storage and memory).'

  return (
    <div className="panel-content">
      <PanelHeader title="History">
        {shownSessions.length > 0 && (
          <Button
            variant="outline"
            className={cn('history-select-toggle', isPicking && 'history-select-toggle-on')}
            title={isPicking ? 'Stop selecting (Esc)' : 'Select conversations to delete several at once'}
            onClick={() => (isPicking ? stopPicking() : setIsPicking(true))}
          >
            {isPicking ? <X size={14} /> : <ListChecks size={14} />}
            {isPicking ? 'Done' : 'Select'}
          </Button>
        )}
      </PanelHeader>
      <SearchBox />
      {isPicking && <SelectionBar shown={shownSessions} pickedPaths={pickedPaths} onPick={setPickedPaths} onDeleted={stopPicking} />}
      {searchHits !== null && <SearchResults hits={searchHits} selectedFilePath={selectedFilePath} picking={picking} />}
      {searchHits === null && (
        <TeamFilter
          hasTeamChats={hasTeamChats}
          isTeamOnly={isTeamOnly}
          onTeamOnlyChange={setIsTeamOnly}
        />
      )}
      {!hasLoaded && (
        <p className="panel-empty">
          <LoadingText text="Reading your conversations…" isDelayed />
        </p>
      )}
      {hasLoaded && searchHits === null && visibleSessions.length === 0 && <p className="panel-empty">{emptyText}</p>}
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
                  picking={picking}
                />
              ))}
            </section>
          )
        )}
    </div>
  )
}
