export interface SearchableCommand {
  title: string
  group: string
  keywords?: string[]
}

function wordsOf(query: string): string[] {
  return query
    .trim()
    .toLowerCase()
    .split(' ')
    .filter((word) => word !== '')
}

function haystackOf(command: SearchableCommand): string {
  return [command.group, command.title, ...(command.keywords ?? [])].join(' ').toLowerCase()
}

function rankOf(command: SearchableCommand, words: string[]): number {
  const title = command.title.toLowerCase()
  const startsWithFirstWord = title.startsWith(words[0])
  const containsAllInTitle = words.every((word) => title.includes(word))
  if (startsWithFirstWord && containsAllInTitle) {
    return 0
  }
  return containsAllInTitle ? 1 : 2
}

export function searchCommands<Command extends SearchableCommand>(commands: Command[], query: string): Command[] {
  const words = wordsOf(query)
  if (words.length === 0) {
    return commands
  }
  return commands
    .filter((command) => {
      const haystack = haystackOf(command)
      return words.every((word) => haystack.includes(word))
    })
    .map((command, index) => ({ command, index, rank: rankOf(command, words) }))
    .sort((first, second) => first.rank - second.rank || first.index - second.index)
    .map((entry) => entry.command)
}
