import { describe, expect, it } from 'vitest'
import { frameMessage, MessageReader } from './messageFraming'

describe('language server message framing', () => {
  it('reads messages split across chunks, with multi-byte characters', () => {
    const first = '{"id":1,"text":"héllo 👋"}'
    const second = '{"id":2}'
    const bytes = Buffer.concat([frameMessage(first), frameMessage(second)])
    const reader = new MessageReader()
    const received: string[] = []
    for (let start = 0; start < bytes.length; start += 7) {
      received.push(...reader.push(bytes.subarray(start, start + 7)))
    }
    expect(received).toEqual([first, second])
  })

  it('accepts extra headers and lower case names, and skips a header without a length', () => {
    const reader = new MessageReader()
    const body = '{"ok":true}'
    const input = `X-Note: hi\r\n\r\ncontent-length: ${Buffer.byteLength(body)}\r\nContent-Type: x\r\n\r\n${body}`
    expect(reader.push(Buffer.from(input))).toEqual([body])
  })
})
