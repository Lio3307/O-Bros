const CHARACTERS_NEEDING_QUOTES = ' &()[]{};,\'`$#!^=+~'

export function quotePathForShell(path: string): string {
  const needsQuotes = Array.from(path).some((character) => CHARACTERS_NEEDING_QUOTES.includes(character))
  return needsQuotes ? `"${path}"` : path
}
