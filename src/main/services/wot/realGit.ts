import { access } from 'node:fs/promises'
import { join } from 'node:path'
import { pathFolders } from '../agents/agentDetector'
import { WOT_BIN_FOLDER, WOT_GUARD_FOLDER } from './wotPaths'

const GIT_FILE_NAME = process.platform === 'win32' ? 'git.exe' : 'git'

let realGitPath: string | null = null

async function exists(filePath: string): Promise<boolean> {
  try {
    await access(filePath)
    return true
  } catch {
    return false
  }
}

export async function locateRealGit(): Promise<void> {
  const ownFolders = [WOT_BIN_FOLDER, WOT_GUARD_FOLDER]
  for (const folder of pathFolders(process.env.PATH)) {
    const candidate = join(folder, GIT_FILE_NAME)
    if (!ownFolders.includes(folder) && (await exists(candidate))) {
      realGitPath = candidate
      return
    }
  }
}

export function currentRealGit(): string | null {
  return realGitPath
}
