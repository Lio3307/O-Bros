import { join } from 'node:path'
import type { AccountUsage } from '../../../shared/types'
import { readJsonIfExists } from '../fileSystem'
import { parseClaudeUsage, type ClaudeUsagePayload } from './claudeUsageParser'
import { fetchJson } from './providerRequest'

const CLAUDE_USAGE_URL = 'https://api.anthropic.com/api/oauth/usage'
const CLAUDE_OAUTH_BETA_HEADER = 'oauth-2025-04-20'

interface ClaudeCredentialsFile {
  claudeAiOauth?: { accessToken?: string }
}

export async function fetchClaudeUsage(configDir: string): Promise<AccountUsage> {
  const credentials = await readJsonIfExists<ClaudeCredentialsFile>(join(configDir, '.credentials.json'))
  const accessToken = credentials?.claudeAiOauth?.accessToken

  if (!accessToken) {
    return {
      fiveHour: null,
      weekly: null,
      errorMessage: 'No saved Claude login found in this folder (macOS keychain logins are not read yet).'
    }
  }

  const payload = await fetchJson<ClaudeUsagePayload>(CLAUDE_USAGE_URL, {
    Authorization: `Bearer ${accessToken}`,
    'anthropic-beta': CLAUDE_OAUTH_BETA_HEADER
  })
  return parseClaudeUsage(payload)
}
