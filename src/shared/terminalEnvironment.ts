const AGENT_HOME_VARIABLES = ['CODEX_HOME', 'CLAUDE_CONFIG_DIR']
const OTHER_TERMINAL_VARIABLES = ['TERM_PROGRAM', 'TERM_PROGRAM_VERSION']
const OTHER_TERMINAL_PREFIXES = ['ORCA_']

function belongsToSomeoneElse(name: string): boolean {
  const upperName = name.toUpperCase()
  return (
    AGENT_HOME_VARIABLES.includes(upperName) ||
    OTHER_TERMINAL_VARIABLES.includes(upperName) ||
    OTHER_TERMINAL_PREFIXES.some((prefix) => upperName.startsWith(prefix))
  )
}

export function cleanTerminalEnvironment(environment: Record<string, string>): Record<string, string> {
  return Object.fromEntries(Object.entries(environment).filter(([name]) => !belongsToSomeoneElse(name)))
}
