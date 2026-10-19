const START_MARKER = '<<<<<<<'
const END_MARKER = '>>>>>>>'

export function hasConflictMarkers(text: string): boolean {
  const lines = text.split('\n')
  return lines.some((line) => line.startsWith(START_MARKER)) && lines.some((line) => line.startsWith(END_MARKER))
}
