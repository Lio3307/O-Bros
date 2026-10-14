import { Play, Trash2, X } from 'lucide-react'
import { useEffect } from 'react'
import { formatBytes } from '../../../shared/format'
import { describeSessionDelete } from '../../../shared/sessionDeleteMessage'
import { groupByDay, type DayGroup } from '../../../shared/time'
import type { SessionSummary } from '../../../shared/types'
import { askToConfirm } from '../../state/confirmStore'
import { useHistoryStore } from '../../state/historyStore'
import { resumeSession } from '../../state/openTerminal'
import { PanelHeader } from '../../ui/PanelHeader'
import { ProviderMark } from '../../ui/ProviderMark'
import './history.css'
import './historyFilter.css'
import { Button } from '../../ui/Button'

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

function SessionItem({ session, isSelected }: { session: SessionSummary; isSelected: boolean }) {
  const select = useHistoryStore((state) => state.select)

  return (
    <div className="session-item">
      <button
        type="button"
        className={isSelected ? 'session-row session-row-selected' : 'session-row'}
        onClick={() => select(session.filePath)}
      >
        <span className="session-title">{session.title}</span>
        <span className="session-meta">
          <ProviderMark provider={session.provider} size={12} /> {formatBytes(session.sizeBytes)} ·{' '}
          {session.projectPath ?? 'Unknown folder'}
        </span>
      </button>
      <div className="session-actions">
        <button
          type="button"
          className="session-action"
          title="Resume this session in a terminal"
          onClick={() => resumeSession(session)}
        >
          <Play size={14} />
        </button>
        <button
          type="button"
          className="session-action"
          title="Delete this session"
          onClick={() => removeAfterConfirm([session])}
        >
          <Trash2 size={14} />
        </button>
      </div>
    </div>
  )
}

function DateFilter() {
  const day = useHistoryStore((state) => state.day)
  const sessions = useHistoryStore((state) => state.sessions)
  const setDay = useHistoryStore((state) => state.setDay)

  return (
    <div className="history-filter">
      <input
        type="date"
        className="history-date"
        value={day ?? ''}
        max={new Date().toLocaleDateString('en-CA')}
        onChange={(event) => void setDay(event.target.value)}
      />
      {day !== null && (
        <Button variant="icon" title="Show all days" onClick={() => setDay(null)}>
          <X size={14} />
        </Button>
      )}
      {day !== null && sessions.length > 0 && (
        <Button variant="remove" className="history-delete-all" onClick={() => removeAfterConfirm(sessions)}>
          Delete {sessions.length}
        </Button>
      )}
    </div>
  )
}

export function HistoryPanel() {
  const sessions = useHistoryStore((state) => state.sessions)
  const selectedFilePath = useHistoryStore((state) => state.selectedFilePath)
  const day = useHistoryStore((state) => state.day)
  const load = useHistoryStore((state) => state.load)

  useEffect(() => {
    void load()
  }, [load])

  const groups = groupSessions(sessions, Date.now())
  const emptyText = day === null ? 'No sessions found on this computer.' : 'No sessions on this day.'

  return (
    <div className="panel-content">
      <PanelHeader title="History" />
      <DateFilter />
      {sessions.length === 0 && <p className="panel-empty">{emptyText}</p>}
      {day !== null &&
        sessions.map((session) => (
          <SessionItem key={session.filePath} session={session} isSelected={session.filePath === selectedFilePath} />
        ))}
      {day === null &&
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
