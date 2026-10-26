import type { ProcessEntry } from './processTable'

const RUNTIME_PROGRAMS = ['cmd', 'node', 'npx', 'bunx', 'deno', 'python', 'python3', 'pythonw', 'py', 'uv', 'uvx', 'powershell', 'pwsh', 'sh', 'bash', 'zsh', 'env', 'wsl']
const LAUNCHER_SCRIPTS = ['npx-cli', 'cli', 'index', 'main', 'bin', 'exec', 'start']
const PACKAGE_MANAGERS: Record<string, string> = { 'npm-cli': 'npm', npm: 'npm', pnpm: 'pnpm', yarn: 'yarn', bun: 'bun' }
const FILE_EXTENSIONS = ['.exe', '.cmd', '.bat', '.ps1', '.js', '.mjs', '.cjs', '.ts', '.py', '.sh']
const CMD_ESCAPE = '^'
const QUOTE = '"'
const PATH_SEPARATORS = ['\\', '/']
const MANAGER_WORDS = 2
const SHORT_SWITCH_LENGTH = 3

function withoutExtension(name: string): string {
  const extension = FILE_EXTENSIONS.find((candidate) => name.toLowerCase().endsWith(candidate))
  return extension === undefined ? name : name.slice(0, name.length - extension.length)
}

function baseNameOf(path: string): string {
  let segments = [path]
  for (const separator of PATH_SEPARATORS) {
    segments = segments.flatMap((segment) => segment.split(separator))
  }
  return segments.filter((segment) => segment !== '').pop() ?? ''
}

function isPathLike(word: string): boolean {
  return word.includes(':') || PATH_SEPARATORS.some((separator) => word.includes(separator))
}

function splitInnerCommand(token: string): string[] {
  const firstWord = token.split(' ')[0]
  return token.includes(' ') && !isPathLike(firstWord) ? token.split(' ').filter((word) => word !== '') : [token]
}

export function commandTokens(commandLine: string): string[] {
  const tokens: string[] = []
  let current = ''
  let isQuoted = false
  for (const character of commandLine.split(CMD_ESCAPE).join('')) {
    if (character === QUOTE) {
      isQuoted = !isQuoted
      continue
    }
    if ((character === ' ' || character === '\t') && !isQuoted) {
      if (current !== '') {
        tokens.push(current)
      }
      current = ''
      continue
    }
    current += character
  }
  return (current === '' ? tokens : [...tokens, current]).flatMap(splitInnerCommand)
}

function isOption(token: string): boolean {
  return token.startsWith('-') || (token.startsWith('/') && token.length <= SHORT_SWITCH_LENGTH)
}

function packageNameOf(token: string): string {
  const versionAt = token.indexOf('@', 1)
  return versionAt === -1 ? token : token.slice(0, versionAt)
}

function wordNameOf(token: string): string {
  return packageNameOf(token.startsWith('@') ? token : withoutExtension(baseNameOf(token)))
}

function managerCommand(manager: string, rest: string[]): string {
  return [manager, ...rest.filter((token) => !isOption(token)).slice(0, MANAGER_WORDS)].join(' ')
}

function nameFromArguments(tokens: string[]): string | null {
  for (const [index, token] of tokens.entries()) {
    if (isOption(token)) {
      continue
    }
    const name = wordNameOf(token)
    const lower = name.toLowerCase()
    const manager = PACKAGE_MANAGERS[lower] as string | undefined
    if (manager !== undefined) {
      return managerCommand(manager, tokens.slice(index + 1))
    }
    if (name !== '' && !RUNTIME_PROGRAMS.includes(lower) && !LAUNCHER_SCRIPTS.includes(lower)) {
      return name
    }
  }
  return null
}

export function friendlyProgramName(entry: Pick<ProcessEntry, 'name' | 'commandLine'>): string | null {
  const program = withoutExtension(entry.name)
  const lower = program.toLowerCase()
  const argumentsAfter = commandTokens(entry.commandLine).slice(1)
  const manager = PACKAGE_MANAGERS[lower] as string | undefined
  if (manager !== undefined) {
    return managerCommand(manager, argumentsAfter)
  }
  return RUNTIME_PROGRAMS.includes(lower) ? nameFromArguments(argumentsAfter) : program === '' ? null : program
}

export function distinctProgramNames(entries: Pick<ProcessEntry, 'name' | 'commandLine'>[], except: string | null): string[] {
  const seen = new Set(except === null ? [] : [except.toLowerCase()])
  const names: string[] = []
  for (const entry of entries) {
    const name = friendlyProgramName(entry)
    if (name !== null && !seen.has(name.toLowerCase())) {
      seen.add(name.toLowerCase())
      names.push(name)
    }
  }
  return names
}
