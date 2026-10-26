import { isAgentCreditLine, stripAgentCredits, type AgentHints } from './agentTraces'
import { hasAnyFlag, optionName } from './gitGuard'

export type HostTool = 'gh' | 'glab'

export const HOST_TOOLS: HostTool[] = ['gh', 'glab']

const OPTIONS_WITH_VALUE = ['-R', '--repo', '-g', '--group', '--hostname']
const COMMAND_DEPTH = 2
const CHANGING_WORDS = [
  'create',
  'delete',
  'edit',
  'update',
  'merge',
  'close',
  'reopen',
  'comment',
  'note',
  'review',
  'approve',
  'revoke',
  'ready',
  'lock',
  'unlock',
  'transfer',
  'pin',
  'unpin',
  'archive',
  'unarchive',
  'rename',
  'fork',
  'sync',
  'set',
  'setup',
  'remove',
  'add',
  'upload',
  'import',
  'run',
  'rerun',
  'retry',
  'cancel',
  'trigger',
  'enable',
  'disable',
  'develop',
  'rebase',
  'subscribe',
  'unsubscribe',
  'stop',
  'link',
  'unlink',
  'copy',
  'mark',
  'install',
  'upgrade'
]
const READING_WORDS = ['view', 'list', 'ls', 'status', 'checks', 'diff', 'watch', 'download', 'checkout', 'browse', 'clone', 'get', 'show', 'log', 'trace', 'lint', 'verify', 'help']
const READING_GROUPS = ['search', 'status', 'browse', 'help', 'completion', 'version']
const SIGN_IN_READS = ['status', 'git-credential']
const TOKEN_FLAGS = ['--show-token', '-t']
const TOKEN_WORD = 'token'
const API_METHOD_OPTIONS = ['-X', '--method']
const API_FIELD_OPTIONS = ['-f', '-F', '--field', '--raw-field', '--input']
const READING_METHODS = ['GET', 'HEAD']
const GRAPHQL_ENDPOINT = 'graphql'
const GRAPHQL_CHANGE = 'mutation'
const BODY_FILE_OPTIONS: Record<string, string> = { '--body-file': '--body', '--notes-file': '--notes' }
const STANDARD_INPUT = '-'
const CREDIT_MARKS = ['co-authored-by', 'generated with']

export function isHostTool(value: unknown): value is HostTool {
  return HOST_TOOLS.includes(value as HostTool)
}

function commandWords(toolArguments: string[]): string[] {
  const words: string[] = []
  let index = 0
  while (index < toolArguments.length) {
    const argument = toolArguments[index]
    if (OPTIONS_WITH_VALUE.includes(argument)) {
      index += 2
      continue
    }
    if (!argument.startsWith('-')) {
      words.push(argument)
    }
    index += 1
  }
  return words
}

function isJoinedShortOption(argument: string, options: string[]): boolean {
  return !argument.startsWith('--') && argument.length > 2 && options.includes(argument.slice(0, 2))
}

function apiMethod(toolArguments: string[]): string | null {
  for (const [index, argument] of toolArguments.entries()) {
    const name = optionName(argument)
    if (API_METHOD_OPTIONS.includes(argument)) {
      return (toolArguments[index + 1] ?? '').toUpperCase()
    }
    if (API_METHOD_OPTIONS.includes(name) && argument !== name) {
      return argument.slice(name.length + 1).toUpperCase()
    }
    if (isJoinedShortOption(argument, ['-X'])) {
      return argument.slice(2).toUpperCase()
    }
  }
  return null
}

function sendsFields(toolArguments: string[]): boolean {
  return toolArguments.some(
    (argument) => API_FIELD_OPTIONS.includes(optionName(argument)) || isJoinedShortOption(argument, ['-f', '-F'])
  )
}

function apiAction(tool: HostTool, words: string[], toolArguments: string[]): string | null {
  if (words.includes(GRAPHQL_ENDPOINT)) {
    return toolArguments.some((argument) => argument.includes(GRAPHQL_CHANGE)) ? `${tool} api graphql (mutation)` : null
  }
  const method = apiMethod(toolArguments) ?? (sendsFields(toolArguments) ? 'POST' : 'GET')
  return READING_METHODS.includes(method) ? null : `${tool} api (${method})`
}

function signInAction(tool: HostTool, words: string[], toolArguments: string[]): string | null {
  const verb = words[1]
  const showsToken = verb === 'status' && hasAnyFlag(toolArguments, TOKEN_FLAGS)
  if (verb === undefined || (SIGN_IN_READS.includes(verb) && !showsToken)) {
    return null
  }
  return [tool, 'auth', verb, ...(showsToken ? [TOKEN_FLAGS[0]] : [])].join(' ')
}

function changingCommand(words: string[]): string[] | null {
  for (const [offset, word] of words.slice(1, 1 + COMMAND_DEPTH).entries()) {
    if (READING_WORDS.includes(word)) {
      return null
    }
    if (word.split('-').some((part) => CHANGING_WORDS.includes(part))) {
      return words.slice(0, offset + 2)
    }
  }
  return null
}

export function guardedHostAction(tool: HostTool, toolArguments: string[]): string | null {
  const words = commandWords(toolArguments)
  const group = words[0]
  if (group === undefined || READING_GROUPS.includes(group)) {
    return null
  }
  if (group === 'api') {
    return apiAction(tool, words, toolArguments)
  }
  if (group === 'auth') {
    return signInAction(tool, words, toolArguments)
  }
  if (group === 'config' && words.some((word) => word.includes(TOKEN_WORD))) {
    return [tool, ...words.slice(0, 3)].join(' ')
  }
  const command = changingCommand(words)
  return command === null ? null : [tool, ...command].join(' ')
}

interface BodyFile {
  inlineOption: string
  path: string
  length: number
}

function bodyFileAt(toolArguments: string[], index: number): BodyFile | null {
  const argument = toolArguments[index]
  const name = optionName(argument)
  const inlineOption = BODY_FILE_OPTIONS[name] as string | undefined
  if (inlineOption === undefined) {
    return null
  }
  const isJoined = argument !== name
  const path = isJoined ? argument.slice(name.length + 1) : toolArguments[index + 1]
  if (path === undefined || path === STANDARD_INPUT) {
    return null
  }
  return { inlineOption, path, length: isJoined ? 1 : 2 }
}

export function bodyFilePaths(toolArguments: string[]): string[] {
  return toolArguments
    .map((_, index) => bodyFileAt(toolArguments, index))
    .filter((bodyFile) => bodyFile !== null)
    .map((bodyFile) => bodyFile.path)
}

export function mayCarryAgentCredits(toolArguments: string[]): boolean {
  return (
    bodyFilePaths(toolArguments).length > 0 ||
    toolArguments.some((argument) => CREDIT_MARKS.some((mark) => argument.toLowerCase().includes(mark)))
  )
}

function hasCreditLine(text: string, hints: AgentHints): boolean {
  return text.split('\n').some((line) => isAgentCreditLine(line, hints))
}

function withoutCreditLines(text: string, hints: AgentHints): string {
  return hasCreditLine(text, hints) ? stripAgentCredits(text, hints) : text
}

export function withoutAgentCredits(toolArguments: string[], hints: AgentHints, fileTexts: Map<string, string>): string[] {
  const cleaned: string[] = []
  let index = 0
  while (index < toolArguments.length) {
    const bodyFile = bodyFileAt(toolArguments, index)
    const fileText = bodyFile === null ? undefined : fileTexts.get(bodyFile.path)
    if (bodyFile !== null && fileText !== undefined && hasCreditLine(fileText, hints)) {
      cleaned.push(bodyFile.inlineOption, stripAgentCredits(fileText, hints))
      index += bodyFile.length
      continue
    }
    cleaned.push(withoutCreditLines(toolArguments[index], hints))
    index += 1
  }
  return cleaned
}
