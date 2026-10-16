const FRONTMATTER_FENCE = '---'
const VERSION_KEY = 'version:'
const QUOTES = ['"', "'"]

function frontmatterLines(text: string): string[] {
  const lines = text.split('\r\n').join('\n').split('\n')
  if (lines[0]?.trim() !== FRONTMATTER_FENCE) {
    return []
  }
  const end = lines.indexOf(FRONTMATTER_FENCE, 1)
  return end === -1 ? [] : lines.slice(1, end)
}

function withoutQuotes(value: string): string {
  const trimmed = value.trim()
  const first = trimmed.charAt(0)
  return QUOTES.includes(first) && trimmed.endsWith(first) ? trimmed.slice(1, -1) : trimmed
}

export function skillVersionOf(text: string): string | null {
  const versionLine = frontmatterLines(text).find((line) => line.trim().startsWith(VERSION_KEY))
  if (versionLine === undefined) {
    return null
  }
  const version = withoutQuotes(versionLine.trim().slice(VERSION_KEY.length))
  return version === '' ? null : version
}

function versionParts(version: string): number[] {
  return version.split('.').map((part) => Number(part) || 0)
}

export function compareVersions(first: string, second: string): number {
  const firstParts = versionParts(first)
  const secondParts = versionParts(second)
  const length = Math.max(firstParts.length, secondParts.length)
  for (let index = 0; index < length; index += 1) {
    const difference = (firstParts[index] ?? 0) - (secondParts[index] ?? 0)
    if (difference !== 0) {
      return difference
    }
  }
  return 0
}
