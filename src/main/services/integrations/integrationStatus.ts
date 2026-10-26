import { execFile } from 'node:child_process'
import { promisify } from 'node:util'
import {
  accountsInAuthStatus,
  INTEGRATIONS,
  stateOfAuthStatus,
  versionInOutput,
  type IntegrationInfo,
  type IntegrationStatus,
  type IntegrationsReport
} from '../../../shared/integrations'
import { findPathCommand } from '../agents/agentDetector'
import { addNewlyInstalledFoldersToPath } from '../systemPath'

const execFileAsync = promisify(execFile)

const CHECK_TIMEOUT_MS = 15000
const MAX_OUTPUT_BYTES = 256 * 1024
const SCRIPT_EXTENSIONS = ['.cmd', '.bat']
const QUIET_ENVIRONMENT = { NO_COLOR: '1', GH_NO_UPDATE_NOTIFIER: '1', GH_PROMPT_DISABLED: '1', GLAB_CHECK_UPDATE: 'false' }

interface CommandOutput {
  text: string
  didFinish: boolean
}

function isScript(filePath: string): boolean {
  return SCRIPT_EXTENSIONS.some((extension) => filePath.toLowerCase().endsWith(extension))
}

function outputOf(error: unknown): CommandOutput {
  const failure = error as { stdout?: string; stderr?: string; killed?: boolean }
  return { text: `${failure.stdout ?? ''}\n${failure.stderr ?? ''}`, didFinish: failure.killed !== true }
}

async function run(filePath: string, args: string[]): Promise<CommandOutput> {
  const options = { windowsHide: true, timeout: CHECK_TIMEOUT_MS, maxBuffer: MAX_OUTPUT_BYTES, env: { ...process.env, ...QUIET_ENVIRONMENT } }
  try {
    const { stdout, stderr } = isScript(filePath)
      ? await execFileAsync('cmd.exe', ['/d', '/s', '/c', `""${filePath}" ${args.join(' ')}"`], { ...options, windowsVerbatimArguments: true })
      : await execFileAsync(filePath, args, options)
    return { text: `${stdout}\n${stderr}`, didFinish: true }
  } catch (error) {
    return outputOf(error)
  }
}

async function statusOf(integration: IntegrationInfo): Promise<IntegrationStatus> {
  const filePath = await findPathCommand(integration.command)
  if (filePath === null) {
    return { id: integration.id, state: 'not-installed', version: null, accounts: [] }
  }
  const [version, authStatus] = await Promise.all([run(filePath, ['--version']), run(filePath, ['auth', 'status'])])
  const accounts = accountsInAuthStatus(authStatus.text)
  return {
    id: integration.id,
    state: authStatus.didFinish ? stateOfAuthStatus(authStatus.text, accounts) : 'unknown',
    version: versionInOutput(version.text),
    accounts
  }
}

export async function readIntegrations(): Promise<IntegrationsReport> {
  await addNewlyInstalledFoldersToPath()
  const [statuses, winget] = await Promise.all([Promise.all(INTEGRATIONS.map(statusOf)), findPathCommand('winget')])
  return { statuses, canInstallWithWinget: process.platform === 'win32' && winget !== null }
}
