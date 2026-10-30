const NO_DAEMON = '--no-daemon'

export function withoutSharedServer(agentArgs: string[], helpText: string): string[] {
  if (agentArgs.includes(NO_DAEMON) || !helpText.includes(NO_DAEMON)) {
    return agentArgs
  }
  return [NO_DAEMON, ...agentArgs]
}
