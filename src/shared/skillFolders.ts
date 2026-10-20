import type { ProviderId } from './types'
import { isRecord } from './isRecord'

export interface SkillFolderRule {
  id: string
  title: string
  command: string | null
  path: string
}

export interface SkillAccount {
  provider: ProviderId
  configDir: string
  isSystemDefault: boolean
}

export interface SkillPlace {
  id: string
  title: string
  command: string | null
  skillsFolder: string
}

const HOME_TOKEN = '{home}'
const ACCOUNT_TOKEN_START = '{account:'
const PROVIDERS: ProviderId[] = ['claude', 'codex']

export function parseSkillFolderRules(raw: unknown): SkillFolderRule[] {
  if (!isRecord(raw) || !Array.isArray(raw.folders)) {
    return []
  }
  return raw.folders.flatMap((entry): SkillFolderRule[] => {
    if (!isRecord(entry) || typeof entry.id !== 'string' || typeof entry.title !== 'string' || typeof entry.path !== 'string') {
      return []
    }
    const command = typeof entry.command === 'string' && entry.command.trim() !== '' ? entry.command.trim() : null
    return [{ id: entry.id, title: entry.title, command, path: entry.path }]
  })
}

function accountProviderOf(path: string): ProviderId | null {
  const start = path.indexOf(ACCOUNT_TOKEN_START)
  if (start === -1) {
    return null
  }
  const end = path.indexOf('}', start)
  const provider = path.slice(start + ACCOUNT_TOKEN_START.length, end)
  return PROVIDERS.find((candidate) => candidate === provider) ?? null
}

function folderNameOf(path: string): string {
  const normalized = path.split('\\').join('/')
  return normalized.slice(normalized.lastIndexOf('/') + 1)
}

export function expandSkillFolders(rules: SkillFolderRule[], home: string, accounts: SkillAccount[]): SkillPlace[] {
  return rules.flatMap((rule): SkillPlace[] => {
    const withHome = rule.path.split(HOME_TOKEN).join(home)
    const provider = accountProviderOf(withHome)
    if (provider === null) {
      return [{ id: rule.id, title: rule.title, command: rule.command, skillsFolder: withHome }]
    }
    const token = `${ACCOUNT_TOKEN_START}${provider}}`
    return accounts
      .filter((account) => account.provider === provider)
      .map((account) => ({
        id: `${rule.id}:${account.configDir}`,
        title: account.isSystemDefault ? rule.title : `${rule.title} (${folderNameOf(account.configDir)})`,
        command: rule.command,
        skillsFolder: withHome.split(token).join(account.configDir)
      }))
  })
}
