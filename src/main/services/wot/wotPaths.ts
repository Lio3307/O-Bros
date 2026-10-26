import { chmod } from 'node:fs/promises'
import { join } from 'node:path'

const WOT_FOLDER = join(__dirname, '../../resources/wot')

export const WOT_BIN_FOLDER = join(WOT_FOLDER, 'bin')
export const WOT_CLI_PATH = join(WOT_FOLDER, 'wot-cli.cjs')
export const WOT_SKILL_SOURCE_PATH = join(WOT_FOLDER, 'SKILL.md')
export const WOT_GUARD_FOLDER = join(WOT_FOLDER, 'guard')
export const GIT_GUARD_PATH = join(WOT_FOLDER, 'git-guard.cjs')
export const HOST_GUARD_FOLDER = join(WOT_FOLDER, 'host-guard')
export const HOST_GUARD_PATH = join(WOT_FOLDER, 'host-guard.cjs')

const RUNNABLE_MODE = 0o755

export async function makeWotCommandRunnable(): Promise<void> {
  if (process.platform === 'win32') {
    return
  }
  try {
    await chmod(join(WOT_BIN_FOLDER, 'wot'), RUNNABLE_MODE)
    await chmod(join(WOT_GUARD_FOLDER, 'git'), RUNNABLE_MODE)
    await chmod(join(HOST_GUARD_FOLDER, 'gh'), RUNNABLE_MODE)
    await chmod(join(HOST_GUARD_FOLDER, 'glab'), RUNNABLE_MODE)
  } catch {
    return
  }
}
