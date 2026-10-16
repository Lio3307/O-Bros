import { readFile } from 'node:fs/promises'
import { homedir } from 'node:os'
import { join } from 'node:path'
import { loginWithRule, parseAgentAuthRules, type AgentAuthRule } from '../../shared/agentAuth'
import { clineLogin, copilotLogin, geminiLogin, loginFromAuthFile, type AgentLogin } from '../../shared/agentLogins'
import { listPathCommands } from './agents/agentDetector'
import { readJsonIfExists, readTextIfExists } from './fileSystem'

type LoginReader = (home: string, rule: AgentAuthRule) => Promise<AgentLogin>

const RULES_PATH = join(__dirname, '../../resources/agents/agent-auth.json')

const READERS: Record<string, LoginReader> = {
  gemini: async (home) =>
    geminiLogin(
      await readJsonIfExists<unknown>(join(home, '.gemini', 'google_accounts.json')),
      await readJsonIfExists<unknown>(join(home, '.gemini', 'settings.json'))
    ),
  opencode: async (home, rule) =>
    loginFromAuthFile(await readJsonIfExists<unknown>(join(home, '.local', 'share', 'opencode', 'auth.json')), rule.command, rule.title, rule.signIn),
  kilo: async (home, rule) =>
    loginFromAuthFile(await readJsonIfExists<unknown>(join(home, '.local', 'share', 'kilo', 'auth.json')), rule.command, rule.title, rule.signIn),
  cline: async (home) => clineLogin(await readJsonIfExists<unknown>(join(home, '.cline', 'data', 'settings', 'providers.json'))),
  copilot: async (home) => copilotLogin(await readTextIfExists(join(home, '.copilot', 'config.json')))
}

function setKeyVariables(rule: AgentAuthRule): string[] {
  return rule.keyVariables.filter((name) => (process.env[name] ?? '').trim() !== '')
}

async function loginOf(rule: AgentAuthRule, home: string): Promise<AgentLogin> {
  const read = READERS[rule.command]
  const detected = read === undefined ? null : await read(home, rule).catch(() => null)
  return loginWithRule(detected, rule, setKeyVariables(rule))
}

export async function readAgentLogins(): Promise<AgentLogin[]> {
  const [installedCommands, rulesText] = await Promise.all([listPathCommands(), readFile(RULES_PATH, 'utf8')])
  const installed = new Set(installedCommands.map((command) => command.toLowerCase()))
  const home = homedir()
  const rules = parseAgentAuthRules(JSON.parse(rulesText)).filter((rule) => installed.has(rule.command))
  return Promise.all(rules.map((rule) => loginOf(rule, home)))
}
