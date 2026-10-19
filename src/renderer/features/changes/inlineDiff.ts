export interface TextSegment {
  text: string
  isChanged: boolean
}

export interface LinePairSegments {
  before: TextSegment[]
  after: TextSegment[]
}

type CharGroup = 'word' | 'space' | 'symbol'

const MAX_TOKENS = 400
const MIN_SIMILARITY = 0.4

function groupOf(char: string): CharGroup {
  if (char.trim() === '') {
    return 'space'
  }
  const isLetter = char.toLowerCase() !== char.toUpperCase()
  const isDigit = char >= '0' && char <= '9'
  return isLetter || isDigit || char === '_' ? 'word' : 'symbol'
}

export function tokenizeLine(text: string): string[] {
  const tokens: string[] = []
  let current = ''
  let currentGroup: CharGroup | null = null
  for (const char of text) {
    const group = groupOf(char)
    if (group === currentGroup && group !== 'symbol') {
      current += char
    } else {
      if (current !== '') {
        tokens.push(current)
      }
      current = char
      currentGroup = group
    }
  }
  if (current !== '') {
    tokens.push(current)
  }
  return tokens
}

function commonTokenTable(before: string[], after: string[]): Uint32Array {
  const width = after.length + 1
  const table = new Uint32Array((before.length + 1) * width)
  for (let row = before.length - 1; row >= 0; row -= 1) {
    for (let column = after.length - 1; column >= 0; column -= 1) {
      table[row * width + column] =
        before[row] === after[column]
          ? table[(row + 1) * width + column + 1] + 1
          : Math.max(table[(row + 1) * width + column], table[row * width + column + 1])
    }
  }
  return table
}

function appendSegment(segments: TextSegment[], text: string, isChanged: boolean): void {
  const last = segments[segments.length - 1]
  if (last !== undefined && last.isChanged === isChanged) {
    last.text += text
  } else {
    segments.push({ text, isChanged })
  }
}

function unchangedLength(segments: TextSegment[]): number {
  return segments.reduce((total, segment) => (segment.isChanged ? total : total + segment.text.length), 0)
}

export function diffLinePair(beforeText: string, afterText: string): LinePairSegments | null {
  const before = tokenizeLine(beforeText)
  const after = tokenizeLine(afterText)
  if (before.length > MAX_TOKENS || after.length > MAX_TOKENS || beforeText === afterText) {
    return null
  }
  const table = commonTokenTable(before, after)
  const width = after.length + 1
  const result: LinePairSegments = { before: [], after: [] }
  let row = 0
  let column = 0
  while (row < before.length || column < after.length) {
    if (row < before.length && column < after.length && before[row] === after[column]) {
      appendSegment(result.before, before[row], false)
      appendSegment(result.after, after[column], false)
      row += 1
      column += 1
    } else if (column < after.length && (row === before.length || table[row * width + column + 1] >= table[(row + 1) * width + column])) {
      appendSegment(result.after, after[column], true)
      column += 1
    } else {
      appendSegment(result.before, before[row], true)
      row += 1
    }
  }
  const similarity = (unchangedLength(result.before) * 2) / (beforeText.length + afterText.length)
  return similarity < MIN_SIMILARITY ? null : result
}
