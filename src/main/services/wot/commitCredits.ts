import { spawn } from 'node:child_process'
import { stripAgentCredits } from '../../../shared/agentTraces'
import { identityEnvironment, type CommitIdentity } from '../../../shared/commitIdentity'
import { loadAgentCatalog } from './agentCatalog'
import { gitGlobalArguments } from '../../../shared/gitGuard'
import { writeLog } from '../logging/logFile'
import { runGit } from '../gitRunner'

function amendMessage(cwd: string, globalArguments: string[], message: string, environment: NodeJS.ProcessEnv): Promise<void> {
  return new Promise((resolve, reject) => {
    const amend = spawn('git', [...globalArguments, 'commit', '--amend', '--no-verify', '--allow-empty', '-F', '-'], {
      cwd,
      env: environment,
      stdio: ['pipe', 'ignore', 'pipe']
    })
    let errorText = ''
    amend.stderr.on('data', (chunk: Buffer) => {
      errorText += chunk.toString()
    })
    amend.on('error', reject)
    amend.on('close', (code) => (code === 0 ? resolve() : reject(new Error(errorText || `git exited with ${code}`))))
    amend.stdin.end(message + '\n')
  })
}

export async function removeAgentCredits(
  cwd: string,
  gitArguments: string[],
  identity: CommitIdentity | null
): Promise<void> {
  const globalArguments = gitGlobalArguments(gitArguments)
  try {
    const stdout = await runGit(cwd, [...globalArguments, 'log', '-1', '--format=%B'])
    const original = stdout.split('\r\n').join('\n').trimEnd()
    const cleaned = stripAgentCredits(original, (await loadAgentCatalog()).hints)
    if (cleaned === original || cleaned.trim() === '') {
      return
    }
    await amendMessage(cwd, globalArguments, cleaned, { ...process.env, ...identityEnvironment(identity) })
  } catch (error) {
    writeLog('warning', 'Could not remove agent credits from a commit: ' + (error instanceof Error ? error.message : 'unknown'))
  }
}
