export const MAX_CONTEXT_CHARS = 20_000

const MINIMUM_FENCE_LENGTH = 3
const FENCE_CHARACTER = '`'

export interface CodeContext {
  path: string
  code: string
  startLine?: number
  endLine?: number
  question?: string
}

export interface DiffContext {
  path: string
  diff: string
  question?: string
}

function longestRunOf(text: string, character: string): number {
  let longest = 0
  let current = 0
  for (const letter of text) {
    current = letter === character ? current + 1 : 0
    longest = Math.max(longest, current)
  }
  return longest
}

export function fenceFor(text: string): string {
  const length = Math.max(MINIMUM_FENCE_LENGTH, longestRunOf(text, FENCE_CHARACTER) + 1)
  return FENCE_CHARACTER.repeat(length)
}

export function languageHintOf(path: string): string {
  const fileName = path.split('/').pop()?.split('\\').pop() ?? ''
  const dotIndex = fileName.lastIndexOf('.')
  return dotIndex > 0 ? fileName.slice(dotIndex + 1).toLowerCase() : ''
}

function lineRangeLabel(startLine: number | undefined, endLine: number | undefined): string {
  if (startLine === undefined) {
    return ''
  }
  if (endLine === undefined || endLine === startLine) {
    return ` (line ${startLine})`
  }
  return ` (lines ${startLine}-${endLine})`
}

function withQuestion(question: string | undefined, body: string): string {
  const trimmed = (question ?? '').trim()
  return trimmed === '' ? body : `${trimmed}\n\n${body}`
}

export function isWithinContextLimit(text: string): boolean {
  return text.length <= MAX_CONTEXT_CHARS
}

export function buildCodeMessage(context: CodeContext): string {
  const fence = fenceFor(context.code)
  const header = `File: ${context.path}${lineRangeLabel(context.startLine, context.endLine)}`
  const body = `${header}\n${fence}${languageHintOf(context.path)}\n${context.code}\n${fence}`
  return withQuestion(context.question, body)
}

export function buildDiffMessage(context: DiffContext): string {
  const fence = fenceFor(context.diff)
  const body = `Changes in ${context.path}:\n${fence}diff\n${context.diff.trimEnd()}\n${fence}`
  return withQuestion(context.question, body)
}
