import { createReadStream } from 'node:fs'
import { createInterface } from 'node:readline'

function parseLine<Line>(rawLine: string): Line | null {
  try {
    return JSON.parse(rawLine) as Line
  } catch (error) {
    if (error instanceof SyntaxError) {
      return null
    }
    throw error
  }
}

export async function* readTranscriptLines<Line>(filePath: string, maxLines?: number): AsyncGenerator<Line> {
  const input = createReadStream(filePath, 'utf8')
  const lines = createInterface({ input, crlfDelay: Infinity })
  let linesRead = 0

  try {
    for await (const rawLine of lines) {
      linesRead += 1
      const line = parseLine<Line>(rawLine)
      if (line !== null) {
        yield line
      }
      if (maxLines !== undefined && linesRead >= maxLines) {
        return
      }
    }
  } finally {
    lines.close()
    input.destroy()
  }
}
