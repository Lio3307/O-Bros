import type { AccountRef, ProviderId } from '../../shared/types'

const configDirVariableByProvider: Record<ProviderId, string> = {
  claude: 'CLAUDE_CONFIG_DIR',
  codex: 'CODEX_HOME'
}

export function buildAccountEnvironment(account: AccountRef | null): Record<string, string> {
  if (account === null) {
    return {}
  }
  return { [configDirVariableByProvider[account.provider]]: account.configDir }
}
