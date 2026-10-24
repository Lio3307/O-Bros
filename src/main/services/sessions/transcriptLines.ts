import { createReadStream } from 'node:fs'
import type { SessionMessage } from '../../../shared/types'

const NEWLINE = 0x0a

export interface ReadMessages {
  messages: SessionMessage[]
  endByte: number
}

interface ReadLine<Line> {
  line: Line | null
  endByte: number
}

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

async function* readCompleteLines<Line>(filePath: string, startByte: number): AsyncGenerator<ReadLine<Line>> {
  const input = createReadStream(filePath, { start: startByte })
  let unfinished: Buffer[] = []
  let chunkStart = startByte

  try {
    for await (const chunk of input as AsyncIterable<Buffer>) {
      let lineStart = 0
      let newline = chunk.indexOf(NEWLINE)
      while (newline !== -1) {
        const piece = chunk.subarray(lineStart, newline)
        const text = (unfinished.length === 0 ? piece : Buffer.concat([...unfinished, piece])).toString('utf8')
        unfinished = []
        yield { line: parseLine<Line>(text), endByte: chunkStart + newline + 1 }
        lineStart = newline + 1
        newline = chunk.indexOf(NEWLINE, lineStart)
      }
      if (lineStart < chunk.length) {
        unfinished.push(chunk.subarray(lineStart))
      }
      chunkStart += chunk.length
    }
    const lastLine = unfinished.length === 0 ? null : parseLine<Line>(Buffer.concat(unfinished).toString('utf8'))
    if (lastLine !== null) {
      yield { line: lastLine, endByte: chunkStart }
    }
  } finally {
    input.destroy()
  }
}

export async function* readTranscriptLines<Line>(filePath: string, maxLines?: number): AsyncGenerator<Line> {
  let linesRead = 0
  for await (const { line } of readCompleteLines<Line>(filePath, 0)) {
    linesRead += 1
    if (line !== null) {
      yield line
    }
    if (maxLines !== undefined && linesRead >= maxLines) {
      return
    }
  }
}

export async function readMessagesFrom<Line>(
  filePath: string,
  startByte: number,
  messageOf: (line: Line) => SessionMessage | null
): Promise<ReadMessages> {
  const messages: SessionMessage[] = []
  let endByte = startByte
  for await (const read of readCompleteLines<Line>(filePath, startByte)) {
    const message = read.line === null ? null : messageOf(read.line)
    if (message !== null) {
      messages.push(message)
    }
    endByte = read.endByte
  }
  return { messages, endByte }
}
