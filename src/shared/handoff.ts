import type { SessionMessage } from './types'

export const MAX_HANDOFF_CHARS = 24_000
const USER_MESSAGE_LIMIT = 3000
const AGENT_MESSAGE_LIMIT = 800
const SHORTENED_MARK = ' […]'

export interface HandoffPart {
  agentName: string
  title: string
  updatedAt: number | null
  messages: SessionMessage[]
  recordPath: string | null
}

export interface HandoffInput {
  marker: string
  cwd: string
  parts: HandoffPart[]
  changedFiles: string[]
}

interface Line {
  text: string
  isGoal: boolean
  isUser: boolean
  isHeading: boolean
}

const NEWEST_SHARE = 0.6
const NOTE_ALLOWANCE = 120

function collapse(text: string): string {
  return text.split('\r').join('').trim()
}

function shorten(text: string, limit: number): string {
  const clean = collapse(text)
  return clean.length > limit ? clean.slice(0, limit - SHORTENED_MARK.length) + SHORTENED_MARK : clean
}

function partHeading(part: HandoffPart): string {
  const when = part.updatedAt === null ? '' : ` · ${new Date(part.updatedAt).toISOString().slice(0, 16).replace('T', ' ')}`
  return `### ${part.agentName}${when} · ${part.title}`
}

function conversationLines(parts: HandoffPart[]): Line[] {
  const lines: Line[] = []
  let hasGoal = false
  for (const part of parts) {
    lines.push({ text: partHeading(part), isGoal: false, isUser: false, isHeading: true })
    for (const message of part.messages) {
      const isUser = message.role === 'user'
      const body = shorten(message.text, isUser ? USER_MESSAGE_LIMIT : AGENT_MESSAGE_LIMIT)
      if (body === '') {
        continue
      }
      const isGoal = isUser && !hasGoal
      hasGoal = hasGoal || isUser
      lines.push({ text: `${isUser ? 'User' : part.agentName}: ${body}`, isGoal, isUser, isHeading: false })
    }
  }
  return lines
}

function headingBefore(lines: Line[], index: number): number {
  for (let candidate = index; candidate >= 0; candidate -= 1) {
    if (lines[candidate].isHeading) {
      return candidate
    }
  }
  return -1
}

function fitConversation(lines: Line[], budget: number): string[] {
  const kept = new Set<number>()
  let used = 0
  function keep(index: number, limit: number): boolean {
    const size = lines[index].text.length + 1 + NOTE_ALLOWANCE
    if (kept.has(index) || used + size > limit) {
      return kept.has(index)
    }
    kept.add(index)
    used += size
    return true
  }
  const goalIndex = lines.findIndex((line) => line.isGoal)
  if (goalIndex >= 0) {
    const goalHeading = headingBefore(lines, goalIndex)
    if (goalHeading >= 0) {
      keep(goalHeading, budget)
    }
    keep(goalIndex, budget)
  }
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (!keep(index, budget * NEWEST_SHARE)) {
      break
    }
  }
  for (let index = lines.length - 1; index >= 0; index -= 1) {
    if (lines[index].isUser && keep(index, budget)) {
      const heading = headingBefore(lines, index)
      if (heading >= 0) {
        keep(heading, budget)
      }
    }
  }
  const result: string[] = []
  let skipped = 0
  lines.forEach((line, index) => {
    if (kept.has(index)) {
      if (skipped > 0) {
        result.push(`[… ${skipped} earlier ${skipped === 1 ? 'line was' : 'lines were'} left out to keep this short; read the full copies listed above.]`)
        skipped = 0
      }
      result.push(line.text)
    } else {
      skipped += 1
    }
  })
  return result
}

export function buildHandoff(input: HandoffInput): string {
  const agentNames = [...new Set(input.parts.map((part) => part.agentName))].join(', ')
  const copies = input.parts.flatMap((part) => (part.recordPath === null ? [] : [`- ${part.recordPath}`]))
  const header = [
    input.marker,
    `You are taking over work the user started with another coding agent (${agentNames}). This handoff from O-BROS tells you what was asked, decided and done, so the user does not have to repeat it.`,
    '',
    `Working folder: ${input.cwd}`,
    ...(copies.length === 0 ? [] : ['Full copies of the earlier conversations (read them if you need more detail):', ...copies]),
    '',
    '## Conversation so far (oldest first)'
  ]
  const footer = [
    '',
    '## Files changed and not committed yet (git)',
    ...(input.changedFiles.length === 0 ? ['(none, or the folder is not a git repository)'] : input.changedFiles.map((file) => `- ${file}`)),
    '',
    '## What to do now',
    "Continue from the user's latest request above. Do not redo work that is already done. Look at the files yourself before you change them. If something is unclear, ask the user."
  ]
  const fixedLength = [...header, ...footer].join('\n').length
  const conversation = fitConversation(conversationLines(input.parts), Math.max(MAX_HANDOFF_CHARS - fixedLength, 0))
  return [...header, ...conversation, ...footer].join('\n')
}
