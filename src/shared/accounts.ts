import type { AccountRef, DetectedAccount } from './types'

export function accountToRef(account: DetectedAccount | null): AccountRef | null {
  if (account === null || account.isSystemDefault) {
    return null
  }
  return { provider: account.provider, configDir: account.configDir }
}
