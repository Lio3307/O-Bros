export const TEAM_MEMBER_ID_PREFIX = 'team-'

export function isTeamMemberPaneId(paneId: string): boolean {
  return paneId.startsWith(TEAM_MEMBER_ID_PREFIX)
}

const MAX_NAME_LENGTH = 32
const ALLOWED_SYMBOLS = ['-', '_']

function isAllowedCharacter(character: string): boolean {
  const isLetter = character >= 'a' && character <= 'z'
  const isDigit = character >= '0' && character <= '9'
  return isLetter || isDigit || ALLOWED_SYMBOLS.includes(character)
}

function cleanName(text: string): string {
  return text
    .trim()
    .toLowerCase()
    .split(' ')
    .join('-')
    .split('')
    .filter(isAllowedCharacter)
    .join('')
    .slice(0, MAX_NAME_LENGTH)
}

export function teamMemberName(requested: string, agentName: string, takenNames: string[]): string {
  const base = cleanName(requested) || cleanName(agentName) || 'agent'
  if (!takenNames.includes(base)) {
    return base
  }
  let number = 2
  while (takenNames.includes(`${base}-${number}`)) {
    number += 1
  }
  return `${base}-${number}`
}
