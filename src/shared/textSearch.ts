export function matchesAllWords(text: string, query: string): boolean {
  const lowered = text.toLowerCase()
  return query.toLowerCase().split(' ').every((word) => lowered.includes(word))
}
