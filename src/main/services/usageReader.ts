import type { AccountRef, AccountUsage } from '../../shared/types'
import { scanAccounts } from './accountScanner'
import { fetchClaudeUsage } from './usage/claudeUsageClient'
import { fetchCodexUsage } from './usage/codexUsageClient'

function failedUsage(error: unknown): AccountUsage {
  const message = error instanceof Error ? error.message : 'Usage could not be read.'
  return { fiveHour: null, weekly: null, errorMessage: message }
}

async function assertKnownAccount(account: AccountRef): Promise<void> {
  const knownAccounts = await scanAccounts()
  const isKnown = knownAccounts.some(
    (candidate) => candidate.provider === account.provider && candidate.configDir === account.configDir
  )
  if (!isKnown) {
    throw new Error('That account was not found on this computer.')
  }
}

export async function readUsage(account: AccountRef): Promise<AccountUsage> {
  try {
    await assertKnownAccount(account)
    return account.provider === 'claude'
      ? await fetchClaudeUsage(account.configDir)
      : await fetchCodexUsage(account.configDir)
  } catch (error) {
    return failedUsage(error)
  }
}
