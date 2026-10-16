import { homedir } from 'node:os'
import { join } from 'node:path'
import { clineLogin, copilotLogin, geminiLogin, loginFromAuthFile, type AgentLogin } from '../../shared/agentLogins'
import { listPathCommands } from './agents/agentDetector'
import { readJsonIfExists, readTextIfExists } from './fileSystem'

type LoginReader = (home: string) => Promise<AgentLogin>

const OPENCODE_HINT = 'Run opencode auth login to add a provider, or opencode auth logout to remove one.'
const KILO_HINT = 'Run kilo auth login to sign in, or kilo auth logout to sign out.'

const READERS: Record<string, LoginReader> = {
  gemini: async (home) =>
    geminiLogin(
      await readJsonIfExists<unknown>(join(home, '.gemini', 'google_accounts.json')),
      await readJsonIfExists<unknown>(join(home, '.gemini', 'settings.json'))
    ),
  opencode: async (home) =>
    loginFromAuthFile(await readJsonIfExists<unknown>(join(home, '.local', 'share', 'opencode', 'auth.json')), 'opencode', 'OpenCode', OPENCODE_HINT),
  kilo: async (home) =>
    loginFromAuthFile(await readJsonIfExists<unknown>(join(home, '.local', 'share', 'kilo', 'auth.json')), 'kilo', 'Kilo Code', KILO_HINT),
  cline: async (home) => clineLogin(await readJsonIfExists<unknown>(join(home, '.cline', 'data', 'settings', 'providers.json'))),
  copilot: async (home) => copilotLogin(await readTextIfExists(join(home, '.copilot', 'config.json')))
}

export async function readAgentLogins(): Promise<AgentLogin[]> {
  const installed = new Set((await listPathCommands()).map((command) => command.toLowerCase()))
  const home = homedir()
  const readers = Object.entries(READERS).filter(([command]) => installed.has(command))
  return Promise.all(readers.map(([, read]) => read(home).catch(() => null))).then((logins) =>
    logins.filter((login): login is AgentLogin => login !== null)
  )
}
