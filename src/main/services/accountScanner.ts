import { mkdir, readdir } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { accountFolderSuffix } from '../../shared/accountFolderName'
import type { DetectedAccount, ProviderId } from '../../shared/types'
import { readJsonIfExists } from './fileSystem'

interface ProviderFolderRule {
  provider: ProviderId
  defaultFolderName: string
}

interface ClaudeSettingsFile {
  oauthAccount?: { emailAddress?: string }
}

const providerFolderRules: ProviderFolderRule[] = [
  { provider: 'claude', defaultFolderName: '.claude' },
  { provider: 'codex', defaultFolderName: '.codex' }
]

function folderBelongsToRule(folderName: string, rule: ProviderFolderRule): boolean {
  return folderName === rule.defaultFolderName || folderName.startsWith(`${rule.defaultFolderName}-`)
}

async function readClaudeEmail(homePath: string, folderName: string, isSystemDefault: boolean): Promise<string | null> {
  const settingsPath = isSystemDefault
    ? join(homePath, '.claude.json')
    : join(homePath, folderName, '.claude.json')
  const settings = await readJsonIfExists<ClaudeSettingsFile>(settingsPath)
  return settings?.oauthAccount?.emailAddress ?? null
}

async function describeAccount(homePath: string, folderName: string, rule: ProviderFolderRule): Promise<DetectedAccount> {
  const isSystemDefault = folderName === rule.defaultFolderName
  const email = rule.provider === 'claude' ? await readClaudeEmail(homePath, folderName, isSystemDefault) : null
  const fallbackLabel = isSystemDefault ? 'System default' : folderName.slice(rule.defaultFolderName.length + 1)

  return {
    id: join(homePath, folderName),
    provider: rule.provider,
    configDir: join(homePath, folderName),
    label: email ?? fallbackLabel,
    isSystemDefault
  }
}

function isAlreadyExistsError(error: unknown): boolean {
  return error instanceof Error && (error as NodeJS.ErrnoException).code === 'EEXIST'
}

export async function createAccountFolder(provider: ProviderId, accountName: string): Promise<string> {
  const rule = providerFolderRules.find((candidate) => candidate.provider === provider)
  if (rule === undefined) {
    throw new Error(`Unknown provider ${provider}`)
  }
  const suffix = accountFolderSuffix(accountName)
  if (suffix === '') {
    throw new Error('Use letters or numbers in the account name.')
  }

  const folderPath = join(homedir(), `${rule.defaultFolderName}-${suffix}`)
  try {
    await mkdir(folderPath)
  } catch (error) {
    if (isAlreadyExistsError(error)) {
      throw new Error(`An account named "${suffix}" already exists.`)
    }
    throw error
  }
  return folderPath
}

function systemDefaultFirst(first: DetectedAccount, second: DetectedAccount): number {
  return Number(second.isSystemDefault) - Number(first.isSystemDefault)
}

export async function scanAccounts(): Promise<DetectedAccount[]> {
  const homePath = homedir()
  const entries = await readdir(homePath, { withFileTypes: true })
  const folderNames = entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name)

  const accounts = await Promise.all(
    providerFolderRules.flatMap((rule) =>
      folderNames
        .filter((folderName) => folderBelongsToRule(folderName, rule))
        .map((folderName) => describeAccount(homePath, folderName, rule))
    )
  )

  return accounts.sort(systemDefaultFirst)
}
