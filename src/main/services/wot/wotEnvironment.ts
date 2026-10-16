import { delimiter } from 'node:path'
import { currentRealGit } from './realGit'
import { currentWotConnection } from './wotConnection'
import { GIT_GUARD_PATH, WOT_BIN_FOLDER, WOT_CLI_PATH, WOT_GUARD_FOLDER } from './wotPaths'

export const WOT_VARIABLES = {
  url: 'O_BROS_WOT_URL',
  token: 'O_BROS_WOT_TOKEN',
  pane: 'O_BROS_WOT_PANE',
  runtime: 'O_BROS_WOT_NODE',
  cli: 'O_BROS_WOT_CLI',
  gitGuard: 'O_BROS_GIT_GUARD',
  realGit: 'O_BROS_REAL_GIT'
}

function pathKeyOf(environment: Record<string, string>): string {
  return Object.keys(environment).find((key) => key.toUpperCase() === 'PATH') ?? 'PATH'
}

function gitGuardVariables(realGit: string | null): Record<string, string> {
  return realGit === null ? {} : { [WOT_VARIABLES.gitGuard]: GIT_GUARD_PATH, [WOT_VARIABLES.realGit]: realGit }
}

export function withWotEnvironment(environment: Record<string, string>, paneId: string): Record<string, string> {
  const connection = currentWotConnection()
  if (connection === null) {
    return environment
  }
  const realGit = currentRealGit()
  const ownFolders = realGit === null ? [WOT_BIN_FOLDER] : [WOT_GUARD_FOLDER, WOT_BIN_FOLDER]
  const pathKey = pathKeyOf(environment)
  const currentPath = environment[pathKey] ?? ''
  return {
    ...environment,
    ...gitGuardVariables(realGit),
    [pathKey]: [...ownFolders, ...(currentPath === '' ? [] : [currentPath])].join(delimiter),
    [WOT_VARIABLES.url]: connection.url,
    [WOT_VARIABLES.token]: connection.token,
    [WOT_VARIABLES.pane]: paneId,
    [WOT_VARIABLES.runtime]: process.execPath,
    [WOT_VARIABLES.cli]: WOT_CLI_PATH
  }
}
