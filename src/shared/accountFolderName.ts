const MAX_SUFFIX_LENGTH = 32
const SEPARATOR = '-'

function isAllowedCharacter(character: string): boolean {
  const isLowerLetter = character >= 'a' && character <= 'z'
  const isDigit = character >= '0' && character <= '9'
  return isLowerLetter || isDigit
}

export function accountFolderSuffix(accountName: string): string {
  const parts: string[] = []
  let currentWord = ''

  for (const character of accountName.trim().toLowerCase()) {
    if (isAllowedCharacter(character)) {
      currentWord += character
    } else if (currentWord !== '') {
      parts.push(currentWord)
      currentWord = ''
    }
  }
  if (currentWord !== '') {
    parts.push(currentWord)
  }

  return parts.join(SEPARATOR).slice(0, MAX_SUFFIX_LENGTH)
}
