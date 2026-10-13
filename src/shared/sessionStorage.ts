import type { SessionStorageReport } from './types'

export const SESSION_AGE_CHOICES_DAYS = [7, 30, 90]

const DAY_MS = 24 * 60 * 60 * 1000

export interface SessionFileFacts {
  sizeBytes: number
  modifiedAt: number
}

export function isOlderThanDays(file: SessionFileFacts, days: number | null, now: number): boolean {
  return days === null || now - file.modifiedAt >= days * DAY_MS
}

function sumBytes(files: SessionFileFacts[]): number {
  return files.reduce((total, file) => total + file.sizeBytes, 0)
}

export function summarizeSessionFiles(files: SessionFileFacts[], now: number): Omit<SessionStorageReport, 'provider'> {
  const ageChoices: (number | null)[] = [...SESSION_AGE_CHOICES_DAYS, null]
  const oldestAt = files.reduce<number | null>(
    (oldest, file) => (oldest === null || file.modifiedAt < oldest ? file.modifiedAt : oldest),
    null
  )

  return {
    sessionCount: files.length,
    totalBytes: sumBytes(files),
    oldestAt,
    buckets: ageChoices.map((days) => {
      const matching = files.filter((file) => isOlderThanDays(file, days, now))
      return { days, sessionCount: matching.length, totalBytes: sumBytes(matching) }
    })
  }
}
