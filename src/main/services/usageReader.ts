import type { AccountRef, AccountUsage } from '../../shared/types'
import { fetchClaudeUsage } from './usage/claudeUsageClient'
import { fetchCodexUsage } from './usage/codexUsageClient'

function failedUsage(error: unknown): AccountUsage {
  const message = error instanceof Error ? error.message : 'Usage could not be read.'
  return { fiveHour: null, weekly: null, errorMessage: message }
}

export async function readUsage(account: AccountRef): Promise<AccountUsage> {
  try {
    return account.provider === 'claude'
      ? await fetchClaudeUsage(account.configDir)
      : await fetchCodexUsage(account.configDir)
  } catch (error) {
    return failedUsage(error)
  }
}
