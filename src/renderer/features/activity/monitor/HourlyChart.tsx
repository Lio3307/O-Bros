import { useState } from 'react'
import { Card } from '../../../ui/Card'

const AXIS_HOURS = [0, 6, 12, 18]

function hourRange(hour: number): string {
  const pad = (value: number) => String(value).padStart(2, '0')
  return `${pad(hour)}:00–${pad((hour + 1) % 24)}:00`
}

function readout(counts: number[], hour: number): string {
  const count = counts[hour]
  return `${hourRange(hour)} · ${count === 1 ? '1 event' : `${count} events`}`
}

export function HourlyChart({ counts, currentHour }: { counts: number[]; currentHour: number }) {
  const [hoveredHour, setHoveredHour] = useState<number | null>(null)
  const highest = Math.max(...counts, 1)
  const total = counts.reduce((sum, count) => sum + count, 0)
  const shownHour = hoveredHour ?? currentHour

  return (
    <Card title="Activity by hour" aside={total === 0 ? 'Nothing yet today' : readout(counts, shownHour)}>
      <div className="hour-bars" role="img" aria-label={`Activity by hour today, ${total} events`} onMouseLeave={() => setHoveredHour(null)}>
        {counts.map((count, hour) => (
          <div
            key={hour}
            className="hour-slot"
            onMouseEnter={() => setHoveredHour(hour)}
            title={readout(counts, hour)}
          >
            <div
              className={[
                'hour-bar',
                count === 0 ? 'hour-bar-empty' : '',
                hour === currentHour ? 'hour-bar-now' : '',
                hour === hoveredHour ? 'hour-bar-hovered' : ''
              ].join(' ')}
              style={{ height: count === 0 ? undefined : `${(count / highest) * 100}%` }}
            />
          </div>
        ))}
      </div>
      <div className="hour-axis">
        {AXIS_HOURS.map((hour) => (
          <span key={hour} style={{ left: `${(hour / 24) * 100}%` }}>
            {String(hour).padStart(2, '0')}:00
          </span>
        ))}
      </div>
    </Card>
  )
}
