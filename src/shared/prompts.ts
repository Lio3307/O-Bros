export interface Prompt {
  id: string
  title: string
  text: string
}

export const DEFAULT_PROMPTS: Prompt[] = [
  {
    id: 'default-explain-error',
    title: 'Explain this error',
    text: 'Explain the error above in plain words, show the most likely cause, and suggest the smallest fix.'
  },
  {
    id: 'default-review-changes',
    title: 'Review my changes',
    text: 'Review the uncommitted changes in this repository. List bugs, risky parts and anything missing, ordered by importance.'
  },
  {
    id: 'default-write-tests',
    title: 'Write tests',
    text: 'Write tests for the code I changed most recently. Cover the normal case, the edge cases and one failure case.'
  },
  {
    id: 'default-commit-message',
    title: 'Suggest a commit message',
    text: 'Look at the staged changes and suggest a short commit message with a title and a two-line body.'
  }
]

export function isUsablePrompt(title: string, text: string): boolean {
  return title.trim() !== '' && text.trim() !== ''
}

function isPrompt(value: unknown): value is Prompt {
  if (typeof value !== 'object' || value === null) {
    return false
  }
  const candidate = value as Record<string, unknown>
  return typeof candidate.id === 'string' && typeof candidate.title === 'string' && typeof candidate.text === 'string'
}

export function parsePrompts(raw: string | null): Prompt[] | null {
  if (raw === null) {
    return null
  }
  try {
    const parsed: unknown = JSON.parse(raw)
    if (!Array.isArray(parsed)) {
      return null
    }
    return parsed.filter(isPrompt)
  } catch {
    return null
  }
}

export function searchPrompts(prompts: Prompt[], query: string): Prompt[] {
  const needle = query.trim().toLowerCase()
  if (needle === '') {
    return prompts
  }
  return prompts.filter(
    (prompt) => prompt.title.toLowerCase().includes(needle) || prompt.text.toLowerCase().includes(needle)
  )
}

export function firstLineOf(text: string): string {
  const [first] = text.trim().split('\n')
  return first ?? ''
}
