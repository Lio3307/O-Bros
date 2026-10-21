import { execFile } from 'node:child_process'
import { join } from 'node:path'
import { promisify } from 'node:util'
import { pathExists } from './fileSystem'

const execFileAsync = promisify(execFile)
const MAX_GIT_OUTPUT_BYTES = 10 * 1024 * 1024

export interface GitRunOptions {
  timeout?: number
  env?: NodeJS.ProcessEnv
}

export async function runGit(cwd: string, args: string[], options: GitRunOptions = {}): Promise<string> {
  const { stdout } = await execFileAsync('git', args, { cwd, maxBuffer: MAX_GIT_OUTPUT_BYTES, ...options })
  return stdout
}

export function isGitRepository(folderPath: string): Promise<boolean> {
  return pathExists(join(folderPath, '.git'))
}
