import { GIT_TRACE_LOG_FORMAT, parseCommitLog, traceOfCommit, type CommitTrace } from '../../../shared/agentTraces'
import { gitGlobalArguments } from '../../../shared/gitGuard'
import type { AgentCatalog } from './agentCatalog'
import { runGit } from '../gitRunner'

const MAX_CHECKED_COMMITS = '200'

async function rangeToPush(cwd: string, globalArguments: string[]): Promise<string[]> {
  try {
    await runGit(cwd, [...globalArguments, 'rev-parse', '--abbrev-ref', '--symbolic-full-name', '@{u}'])
    return ['@{u}..HEAD']
  } catch {
    return ['HEAD', '--not', '--remotes']
  }
}

export async function findPushTraces(cwd: string, gitArguments: string[], catalog: AgentCatalog): Promise<CommitTrace[]> {
  const globalArguments = gitGlobalArguments(gitArguments)
  try {
    const range = await rangeToPush(cwd, globalArguments)
    const output = await runGit(cwd, [
      ...globalArguments,
      'log',
      '-n',
      MAX_CHECKED_COMMITS,
      `--format=${GIT_TRACE_LOG_FORMAT}`,
      ...range
    ])
    return parseCommitLog(output)
      .map((commit) => traceOfCommit(commit, catalog.hints))
      .filter((trace): trace is CommitTrace => trace !== null)
  } catch {
    return []
  }
}
