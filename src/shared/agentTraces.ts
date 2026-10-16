import { shortAgentName } from './agentLaunchers'

const MIN_WORD_LENGTH = 4
const FIELD_SEPARATOR = '\u001f'
const RECORD_SEPARATOR = '\u001e'
const SHORT_HASH_LENGTH = 7
const MAX_SUBJECT_LENGTH = 60
const AGENT_EMAIL_MARKS = ['noreply@anthropic.com', 'noreply@openai.com', '[bot]@users.noreply.github.com']
const CO_AUTHOR_PREFIX = 'co-authored-by:'
const GENERATED_MARK = 'generated with'
const ROBOT_MARK = '🤖'
const GENERIC_WORDS = ['code', 'agent', 'agents', 'chat', 'build', 'fast', 'deep', 'open']

export const GIT_TRACE_LOG_FORMAT = ['%H', '%an', '%ae', '%cn', '%ce', '%B'].join('%x1f') + '%x1e'

export interface AgentHints {
  names: string[]
  words: string[]
}

export interface CommitRecord {
  hash: string
  authorName: string
  authorEmail: string
  committerName: string
  committerEmail: string
  message: string
}

export interface CommitTrace {
  hash: string
  subject: string
  reasons: string[]
}

function normalize(text: string): string {
  return text.trim().toLowerCase()
}

function isWordCharacter(character: string): boolean {
  return (character >= 'a' && character <= 'z') || (character >= '0' && character <= '9')
}

function wordsOf(text: string): string[] {
  const words: string[] = []
  let current = ''
  for (const character of text.toLowerCase()) {
    if (isWordCharacter(character)) {
      current += character
      continue
    }
    if (current !== '') {
      words.push(current)
    }
    current = ''
  }
  return current === '' ? words : [...words, current]
}

export function agentHintsFrom(agentNames: string[]): AgentHints {
  const names = agentNames.flatMap((name) => [normalize(name), normalize(shortAgentName(name))]).filter((name) => name !== '')
  const words = agentNames
    .flatMap(wordsOf)
    .filter((word) => word.length >= MIN_WORD_LENGTH && !GENERIC_WORDS.includes(word))
  return { names: Array.from(new Set(names)), words: Array.from(new Set(words)) }
}

export function mentionsAgent(text: string, hints: AgentHints): boolean {
  return wordsOf(text).some((word) => hints.words.includes(word))
}

function isAgentEmail(email: string): boolean {
  const lowered = email.toLowerCase()
  return AGENT_EMAIL_MARKS.some((mark) => lowered.includes(mark))
}

function isAgentPerson(name: string, email: string, hints: AgentHints): boolean {
  return isAgentEmail(email) || hints.names.includes(normalize(name))
}

function personOf(text: string): { name: string; email: string } {
  const open = text.indexOf('<')
  const close = text.indexOf('>', open)
  if (open === -1 || close === -1) {
    return { name: text.trim(), email: '' }
  }
  return { name: text.slice(0, open).trim(), email: text.slice(open + 1, close).trim() }
}

export function isAgentCreditLine(line: string, hints: AgentHints): boolean {
  const trimmed = line.trim()
  const lowered = trimmed.toLowerCase()
  if (lowered.startsWith(CO_AUTHOR_PREFIX)) {
    const { name, email } = personOf(trimmed.slice(CO_AUTHOR_PREFIX.length))
    return isAgentPerson(name, email, hints)
  }
  return lowered.includes(GENERATED_MARK) && (trimmed.includes(ROBOT_MARK) || mentionsAgent(trimmed, hints))
}

export function stripAgentCredits(message: string, hints: AgentHints): string {
  const lines = message
    .split('\r\n')
    .join('\n')
    .split('\n')
    .filter((line) => !isAgentCreditLine(line, hints))
  while (lines.length > 0 && lines[lines.length - 1].trim() === '') {
    lines.pop()
  }
  return lines.join('\n')
}

export function parseCommitLog(output: string): CommitRecord[] {
  return output
    .split(RECORD_SEPARATOR)
    .map((record) => record.trim())
    .filter((record) => record !== '')
    .map((record) => {
      const [hash, authorName, authorEmail, committerName, committerEmail, ...messageParts] = record.split(FIELD_SEPARATOR)
      return { hash, authorName, authorEmail, committerName, committerEmail, message: messageParts.join(FIELD_SEPARATOR) }
    })
}

export function traceOfCommit(commit: CommitRecord, hints: AgentHints): CommitTrace | null {
  const reasons: string[] = []
  if (isAgentPerson(commit.authorName, commit.authorEmail, hints)) {
    reasons.push(`author is ${commit.authorName} <${commit.authorEmail}>`)
  }
  if (isAgentPerson(commit.committerName, commit.committerEmail, hints)) {
    reasons.push(`committer is ${commit.committerName} <${commit.committerEmail}>`)
  }
  reasons.push(
    ...commit.message
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => isAgentCreditLine(line, hints))
  )
  if (reasons.length === 0) {
    return null
  }
  const subject = (commit.message.split('\n')[0] ?? '').slice(0, MAX_SUBJECT_LENGTH)
  return { hash: commit.hash.slice(0, SHORT_HASH_LENGTH), subject, reasons }
}

export function describeTraces(traces: CommitTrace[]): string[] {
  return traces.map((trace) => `${trace.hash} "${trace.subject}": ${trace.reasons.join('; ')}`)
}
