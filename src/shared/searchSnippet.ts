const CONTEXT_CHARACTERS = 60

export function findIgnoringCase(text: string, query: string): number {
  return text.toLowerCase().indexOf(query.toLowerCase())
}

export function makeSnippet(text: string, matchIndex: number, queryLength: number): string {
  const start = Math.max(0, matchIndex - CONTEXT_CHARACTERS)
  const end = Math.min(text.length, matchIndex + queryLength + CONTEXT_CHARACTERS)
  const flattened = text.slice(start, end).split('\n').join(' ').trim()
  const prefix = start > 0 ? '…' : ''
  const suffix = end < text.length ? '…' : ''
  return prefix + flattened + suffix
}
