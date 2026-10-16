import { formatResetsIn } from '../../shared/time'
import type { AccountUsage, UsageWindow } from '../../shared/types'

export interface LabeledWindow {
  label: string
  window: UsageWindow
}

export interface CompactUsageText {
  percent: string
  remaining: string
}

export function describeCompactWindow(window: UsageWindow, now: number): CompactUsageText {
  return {
    percent: `${window.percentUsed}%`,
    remaining: formatResetsIn(window.resetsAt, now)
  }
}

export function listUsageWindows(usage: AccountUsage | undefined): LabeledWindow[] {
  const windows: LabeledWindow[] = []
  if (usage?.fiveHour) {
    windows.push({ label: '5h', window: usage.fiveHour })
  }
  if (usage?.weekly) {
    windows.push({ label: 'wk', window: usage.weekly })
  }
  return windows
}

export function nearestReset(windows: LabeledWindow[]): UsageWindow | null {
  if (windows.length === 0) {
    return null
  }
  return windows.reduce((nearest, entry) => (entry.window.resetsAt < nearest.resetsAt ? entry.window : nearest), windows[0].window)
}

export interface TrackedUsage<Key> {
  key: Key
  windows: LabeledWindow[]
}

export interface PressingWindow<Key> extends LabeledWindow {
  key: Key
}

export function mostPressingWindow<Key>(tracked: TrackedUsage<Key>[]): PressingWindow<Key> | null {
  let pressing: PressingWindow<Key> | null = null
  for (const { key, windows } of tracked) {
    for (const { label, window } of windows) {
      const isHigher = pressing === null || window.percentUsed > pressing.window.percentUsed
      const isTieResettingLater =
        pressing !== null && window.percentUsed === pressing.window.percentUsed && window.resetsAt < pressing.window.resetsAt
      if (isHigher || isTieResettingLater) {
        pressing = { key, label, window }
      }
    }
  }
  return pressing
}
