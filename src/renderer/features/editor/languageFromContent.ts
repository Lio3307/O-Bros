import { lastPathSegment } from '../../../shared/paths'

export function interpreterOf(firstLine: string): string | null {
  if (!firstLine.startsWith('#!')) {
    return null
  }
  const words = firstLine.slice(2).trim().split(' ').filter((word) => word.length > 0)
  const program = lastPathSegment(words[0] ?? '')
  const name = program === 'env' ? words.slice(1).find((word) => !word.startsWith('-')) : program
  return name === undefined || name.length === 0 ? null : name
}

export function looksLikeMarkup(firstLine: string): boolean {
  return firstLine.trimStart().startsWith('<')
}
