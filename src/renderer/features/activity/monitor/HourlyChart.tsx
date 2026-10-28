import { useState, type MouseEvent } from 'react'
import { describeActivity, sumOfHours, totalOfHour, type HourActivity } from '../../../../shared/activityStats'
import { Card } from '../../../ui/Card'
import { cn } from '../../../ui/cn'
import { CursorTooltip, type CursorPoint } from '../../../ui/CursorTooltip'

const HOURS_PER_DAY = 24
const AXIS_HOURS = [0, 6, 12, 18]
const NOW_LABEL_ROOM_HOURS = 2.5
const NO_ACTIVITY: HourActivity = { sessions: 0, gitActions: 0, teamMembers: 0 }

const KINDS: { key: keyof HourActivity; label: string; className: string }[] = [
  { key: 'sessions', label: 'Agent sessions started', className: 'hour-part-session' },
  { key: 'gitActions', label: 'Git actions agents asked for', className: 'hour-part-git' },
  { key: 'teamMembers', label: 'Team members summoned', className: 'hour-part-team' }
]

interface PointedHour {
  hour: number
  point: CursorPoint
}

function twoDigits(value: number): string {
  return String(value).padStart(2, '0')
}

function hourRange(hour: number): string {
  return `${twoDigits(hour)}:00–${twoDigits((hour + 1) % HOURS_PER_DAY)}:00`
}

function hourUnderCursor(event: MouseEvent<HTMLElement>): number {
  const area = event.currentTarget.getBoundingClientRect()
  const share = (event.clientX - area.left) / area.width
  return Math.min(HOURS_PER_DAY - 1, Math.max(0, Math.floor(share * HOURS_PER_DAY)))
}

function HourBar({ hour, highest }: { hour: HourActivity; highest: number }) {
  const total = totalOfHour(hour)
  if (total === 0) {
    return <div className="hour-bar hour-bar-empty" />
  }
  return (
    <div className="hour-bar" style={{ height: `${(total / highest) * 100}%` }}>
      {KINDS.filter((kind) => hour[kind.key] > 0).map((kind) => (
        <div key={kind.key} className={cn('hour-part', kind.className)} style={{ flexGrow: hour[kind.key] }} />
      ))}
    </div>
  )
}

function HourDetails({ hour, activity }: { hour: number; activity: HourActivity }) {
  const kindsThatHappened = KINDS.filter((kind) => activity[kind.key] > 0)
  return (
    <>
      <strong className="hour-tooltip-title">{hourRange(hour)}</strong>
      {kindsThatHappened.length === 0 && <span className="muted">Nothing happened</span>}
      {kindsThatHappened.map((kind) => (
        <span key={kind.key} className="hour-tooltip-line">
          <span className={cn('hour-legend-swatch', kind.className)} aria-hidden="true" />
          {describeActivity({ ...NO_ACTIVITY, [kind.key]: activity[kind.key] })}
        </span>
      ))}
    </>
  )
}

export function HourlyChart({ hours, currentHour }: { hours: HourActivity[]; currentHour: number }) {
  const [pointed, setPointed] = useState<PointedHour | null>(null)
  const today = sumOfHours(hours)
  const highest = Math.max(...hours.map(totalOfHour), 1)

  if (totalOfHour(today) === 0) {
    return (
      <Card title="Today by hour">
        <p className="monitor-empty">
          Nothing yet today. Starting an agent, a git command an agent asks to run, and summoning a team member show up here, hour by hour.
        </p>
      </Card>
    )
  }

  return (
    <Card title="Today by hour">
      <p className="hour-readout">Today: {describeActivity(today)}</p>
      <div
        className="hour-bars"
        role="img"
        aria-label={`Today by hour: ${describeActivity(today)}`}
        onMouseMove={(event) => setPointed({ hour: hourUnderCursor(event), point: { x: event.clientX, y: event.clientY } })}
        onMouseLeave={() => setPointed(null)}
      >
        {hours.map((hour, index) => (
          <div key={index} className={cn('hour-slot', index === pointed?.hour && 'hour-slot-hovered')}>
            <HourBar hour={hour} highest={highest} />
          </div>
        ))}
      </div>
      <div className="hour-axis">
        {AXIS_HOURS.filter((hour) => Math.abs(hour - (currentHour + 0.5)) > NOW_LABEL_ROOM_HOURS).map((hour) => (
          <span key={hour} style={{ left: `${(hour / HOURS_PER_DAY) * 100}%` }}>
            {twoDigits(hour)}:00
          </span>
        ))}
        <span className="hour-axis-now" style={{ left: `${((currentHour + 0.5) / HOURS_PER_DAY) * 100}%` }}>
          now
        </span>
      </div>
      <ul className="hour-legend">
        {KINDS.map((kind) => (
          <li key={kind.key}>
            <span className={cn('hour-legend-swatch', kind.className)} aria-hidden="true" />
            {kind.label}
          </li>
        ))}
      </ul>
      <CursorTooltip point={pointed?.point ?? null}>
        {pointed !== null && <HourDetails hour={pointed.hour} activity={hours[pointed.hour]} />}
      </CursorTooltip>
    </Card>
  )
}
