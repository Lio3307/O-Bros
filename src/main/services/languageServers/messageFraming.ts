const HEADER_END = '\r\n\r\n'
const LENGTH_HEADER = 'content-length:'

export function frameMessage(message: string): Buffer {
  const body = Buffer.from(message, 'utf8')
  return Buffer.concat([Buffer.from(`Content-Length: ${body.length}${HEADER_END}`, 'ascii'), body])
}

function contentLengthOf(header: string): number | null {
  for (const line of header.split('\r\n')) {
    if (line.toLowerCase().startsWith(LENGTH_HEADER)) {
      const length = Number(line.slice(LENGTH_HEADER.length).trim())
      return Number.isInteger(length) && length >= 0 ? length : null
    }
  }
  return null
}

export class MessageReader {
  private pending: Buffer = Buffer.alloc(0)

  push(chunk: Buffer): string[] {
    this.pending = Buffer.concat([this.pending, chunk])
    const messages: string[] = []
    for (;;) {
      const headerEnd = this.pending.indexOf(HEADER_END)
      if (headerEnd < 0) {
        return messages
      }
      const length = contentLengthOf(this.pending.subarray(0, headerEnd).toString('ascii'))
      const bodyStart = headerEnd + HEADER_END.length
      if (length === null) {
        this.pending = this.pending.subarray(bodyStart)
        continue
      }
      if (this.pending.length < bodyStart + length) {
        return messages
      }
      messages.push(this.pending.subarray(bodyStart, bodyStart + length).toString('utf8'))
      this.pending = this.pending.subarray(bodyStart + length)
    }
  }
}
