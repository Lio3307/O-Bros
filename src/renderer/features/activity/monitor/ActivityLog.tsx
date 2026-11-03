import { Search, Trash2, X } from 'lucide-react'
import { useRef, useState } from 'react'
import type { ActivityEntry } from '../../../../shared/activity'
import { pageOf } from '../../../../shared/pagination'
import { lastPathSegment } from '../../../../shared/paths'
import { useActivityStore } from '../../../state/activityStore'
import { askToConfirm } from '../../../state/confirmStore'
import { AgentName } from '../../../ui/AgentName'
import { Button } from '../../../ui/Button'
import { Card } from '../../../ui/Card'
import { OutcomeBadge } from '../../../ui/OutcomeBadge'
import { Pagination } from '../../../ui/Pagination'
import { useDebouncedValue } from '../../../ui/useDebouncedValue'
import { groupActivityByDay } from '../activityDays'
import { filterActivity } from '../activityLogFilter'
import '../activity.css'

const LINE_BREAK = '\n'
const PAGE_SIZE = 25
const SEARCH_DEBOUNCE_MS = 200

function timeOf(at: number): string {
  return new Date(at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' })
}

function ActivityRow({ entry }: { entry: ActivityEntry }) {
  const place = entry.folder === null ? 'Home' : lastPathSegment(entry.folder)
  const facts = [entry.detail, place].filter((fact): fact is string => fact !== null && fact !== '')
  const hoverText = [entry.detail, entry.folder].filter((line) => line !== null).join(LINE_BREAK)
  return (
    <div className="activity-row" title={hoverText}>
      <span className="activity-time">{timeOf(entry.at)}</span>
      <span className="activity-text">
        <span className="activity-title">
          <AgentName command={entry.agentCommand} isStrong /> {entry.text}
        </span>
        <span className="muted activity-detail">{facts.join(' · ')}</span>
      </span>
      {entry.outcome !== null && <OutcomeBadge outcome={entry.outcome} />}
    </div>
  )
}

async function confirmClear(): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: 'Clear the activity log?',
    message: 'This removes every entry from the log and resets the numbers above. Your sessions, commits and files are not touched.',
    confirmLabel: 'Clear',
    tone: 'danger'
  })
  if (isConfirmed) {
    await useActivityStore.getState().clear()
  }
}

export function ActivityLog({ entries, now }: { entries: ActivityEntry[]; now: number }) {
  const [query, setQuery] = useState('')
  const [wantedPage, setWantedPage] = useState(1)
  const logRef = useRef<HTMLDivElement>(null)
  const settledQuery = useDebouncedValue(query, SEARCH_DEBOUNCE_MS)
  const current = pageOf(filterActivity(entries, settledQuery), wantedPage, PAGE_SIZE)
  const days = groupActivityByDay(current.items, now)

  function search(text: string): void {
    setQuery(text)
    setWantedPage(1)
  }

  function showPage(page: number): void {
    setWantedPage(page)
    logRef.current?.scrollIntoView({ block: 'start' })
  }

  return (
    <Card
      title="Log"
      aside={
        entries.length > 0 && (
          <Button variant="icon" className="hover-danger" title="Clear the activity log" onClick={() => void confirmClear()}>
            <Trash2 size={14} />
          </Button>
        )
      }
    >
      <div ref={logRef} className="activity-log">
        {entries.length === 0 && (
          <p className="monitor-empty">Nothing yet. Agent sessions, the git actions agents ask for, and team members show up here.</p>
        )}
        {entries.length > 0 && (
          <div className="activity-log-tools">
            <label className="find-field">
              <Search size={14} />
              <input placeholder="Search the log" value={query} onChange={(event) => search(event.target.value)} />
              {query !== '' && (
                <Button variant="icon" title="Clear the search" aria-label="Clear the search" onClick={() => search('')}>
                  <X size={14} />
                </Button>
              )}
            </label>
          </div>
        )}
        {entries.length > 0 && days.length === 0 && <p className="monitor-empty">No log entries match that.</p>}
        {days.map((day) => (
          <section key={day.label} className="activity-day">
            <h4 className="monitor-section-title">{day.label}</h4>
            {day.entries.map((entry) => (
              <ActivityRow key={entry.id} entry={entry} />
            ))}
          </section>
        ))}
        <Pagination current={current} onChange={showPage} />
      </div>
    </Card>
  )
}
