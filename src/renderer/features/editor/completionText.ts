const MIN_WORD_LENGTH = 3
const MAX_WORDS_PER_FILE = 5000

const PATH_STARTS = ['./', '../']

function isLetter(character: string): boolean {
  return character.toLowerCase() !== character.toUpperCase()
}

function isDigit(character: string): boolean {
  return character >= '0' && character <= '9'
}

export function isWordCharacter(character: string): boolean {
  return isLetter(character) || isDigit(character) || character === '_' || character === '$'
}

export function wordsIn(text: string): string[] {
  const words = new Set<string>()
  let current = ''
  for (const character of text) {
    if (isWordCharacter(character)) {
      current += character
      continue
    }
    if (current.length >= MIN_WORD_LENGTH && !isDigit(current[0])) {
      words.add(current)
    }
    current = ''
    if (words.size >= MAX_WORDS_PER_FILE) {
      break
    }
  }
  if (current.length >= MIN_WORD_LENGTH && !isDigit(current[0])) {
    words.add(current)
  }
  return [...words]
}

export function wordBefore(textBeforeCursor: string): string {
  let start = textBeforeCursor.length
  while (start > 0 && isWordCharacter(textBeforeCursor[start - 1])) {
    start -= 1
  }
  return textBeforeCursor.slice(start)
}

export interface PathQuery {
  folderPart: string
  namePart: string
}

export function pathQueryOf(textInString: string): PathQuery | null {
  const normalized = textInString.split('\\').join('/')
  if (!PATH_STARTS.some((start) => normalized.startsWith(start))) {
    return null
  }
  const lastSlash = normalized.lastIndexOf('/')
  return { folderPart: normalized.slice(0, lastSlash + 1), namePart: normalized.slice(lastSlash + 1) }
}
