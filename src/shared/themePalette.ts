export interface ThemePalette {
  id: string
  label: string
  background: string
  foreground: string
  cursor: string
  selection: string
  ansi: string[]
}

export const ANSI_COLOR_COUNT = 16

function isIdCharacter(character: string): boolean {
  return (character >= 'a' && character <= 'z') || (character >= '0' && character <= '9')
}

export function themeIdOf(label: string): string {
  return [...label.normalize('NFD').toLowerCase()]
    .map((character) => (isIdCharacter(character) ? character : '-'))
    .join('')
    .split('-')
    .filter((part) => part !== '')
    .join('-')
}
