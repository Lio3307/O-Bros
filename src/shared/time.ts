const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export function formatResetsIn(resetsAt: number, now: number): string {
  const remaining = Math.max(resetsAt - now, 0)
  const days = Math.floor(remaining / DAY_MS)
  const hours = Math.floor((remaining % DAY_MS) / HOUR_MS)
  const minutes = Math.floor((remaining % HOUR_MS) / MINUTE_MS)

  if (days > 0) {
    return hours === 0 ? `${days}d` : `${days}d ${hours}h`
  }
  if (hours > 0) {
    return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`
  }
  return `${minutes}m`
}

export function formatAge(timestamp: number, now: number): string {
  const elapsed = Math.max(now - timestamp, 0)

  if (elapsed >= DAY_MS) {
    return `${Math.floor(elapsed / DAY_MS)}d ago`
  }
  if (elapsed >= HOUR_MS) {
    return `${Math.floor(elapsed / HOUR_MS)}h ago`
  }
  return `${Math.floor(elapsed / MINUTE_MS)}m ago`
}

export type DayGroup = 'Today' | 'Yesterday' | 'Earlier'

export function groupByDay(timestamp: number, now: number): DayGroup {
  const startOfToday = new Date(now).setHours(0, 0, 0, 0)
  if (timestamp >= startOfToday) {
    return 'Today'
  }
  if (timestamp >= startOfToday - DAY_MS) {
    return 'Yesterday'
  }
  return 'Earlier'
}

export interface DayRange {
  start: number
  end: number
}

export function dayRangeFromInput(value: string): DayRange | null {
  const [year, month, day] = value.split('-').map(Number)
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null
  }
  const start = new Date(year, month - 1, day)
  const isRealDate = start.getFullYear() === year && start.getMonth() === month - 1 && start.getDate() === day
  if (!isRealDate) {
    return null
  }
  return { start: start.getTime(), end: new Date(year, month - 1, day + 1).getTime() }
}
