export type ShellKind = 'powershell' | 'posix'

const SINGLE_QUOTE = "'"

export function shellKindOf(platform: string): ShellKind {
  return platform === 'win32' ? 'powershell' : 'posix'
}

export function quoteShellArgument(argument: string, shell: ShellKind): string {
  const escapedQuote = shell === 'powershell' ? "''" : "'\\''"
  return SINGLE_QUOTE + argument.split(SINGLE_QUOTE).join(escapedQuote) + SINGLE_QUOTE
}

export function commandWithArguments(command: string, args: string[], shell: ShellKind): string {
  return [command, ...args.map((argument) => quoteShellArgument(argument, shell))].join(' ')
}

export function runOnceArguments(command: string, shell: ShellKind): string[] {
  return shell === 'powershell' ? ['-NoLogo', '-Command', command] : ['-c', command]
}
