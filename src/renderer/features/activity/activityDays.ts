import type { ActivityEntry } from '../../../shared/activity'

const DAY_MS = 24 * 60 * 60 * 1000

export interface ActivityDay {
  label: string
  entries: ActivityEntry[]
}

function dayLabel(dayStart: number, todayStart: number): string {
  if (dayStart === todayStart) {
    return 'Today'
  }
  if (dayStart === new Date(todayStart - DAY_MS).setHours(0, 0, 0, 0)) {
    return 'Yesterday'
  }
  return new Date(dayStart).toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })
}

export function groupActivityByDay(entries: ActivityEntry[], now: number): ActivityDay[] {
  const todayStart = new Date(now).setHours(0, 0, 0, 0)
  const days: { start: number; day: ActivityDay }[] = []
  const newestFirst = [...entries].sort((first, second) => second.at - first.at)
  for (const entry of newestFirst) {
    const start = new Date(entry.at).setHours(0, 0, 0, 0)
    const last = days.at(-1)
    if (last !== undefined && last.start === start) {
      last.day.entries.push(entry)
    } else {
      days.push({ start, day: { label: dayLabel(start, todayStart), entries: [entry] } })
    }
  }
  return days.map(({ day }) => day)
}
