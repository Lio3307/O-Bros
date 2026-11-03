import { FIRST_LISTED_SESSIONS } from './types'

const MOST_LISTED_SESSIONS = 100_000

export function sessionListLimit(requested: unknown): number {
  if (typeof requested !== 'number' || !Number.isFinite(requested)) {
    return FIRST_LISTED_SESSIONS
  }
  return Math.min(Math.max(Math.floor(requested), 1), MOST_LISTED_SESSIONS)
}
