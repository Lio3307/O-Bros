import { join } from 'node:path'
import type { AccountUsage } from '../../../shared/types'
import { readJsonIfExists } from '../fileSystem'
import { parseCodexUsage, type CodexUsagePayload } from './codexUsageParser'
import { fetchJson } from './providerRequest'

const CODEX_USAGE_URL = 'https://chatgpt.com/backend-api/wham/usage'

interface CodexAuthFile {
  tokens?: { access_token?: string; account_id?: string }
}

export async function fetchCodexUsage(configDir: string): Promise<AccountUsage> {
  const auth = await readJsonIfExists<CodexAuthFile>(join(configDir, 'auth.json'))
  const accessToken = auth?.tokens?.access_token

  if (!accessToken) {
    return {
      fiveHour: null,
      weekly: null,
      errorMessage: 'No saved ChatGPT login found for Codex in this folder.'
    }
  }

  const headers: Record<string, string> = { Authorization: `Bearer ${accessToken}` }
  if (auth?.tokens?.account_id) {
    headers['ChatGPT-Account-Id'] = auth.tokens.account_id
  }

  const payload = await fetchJson<CodexUsagePayload>(CODEX_USAGE_URL, headers)
  return parseCodexUsage(payload)
}
