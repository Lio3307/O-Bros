const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

export function formatResetsIn(resetsAt: number, now: number): string {
  return formatDuration(resetsAt - now)
}

export function formatShortDuration(durationMs: number): string {
  return durationMs > 0 && durationMs < MINUTE_MS ? '<1m' : formatDuration(durationMs)
}

export function formatDuration(durationMs: number): string {
  const remaining = Math.max(durationMs, 0)
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
