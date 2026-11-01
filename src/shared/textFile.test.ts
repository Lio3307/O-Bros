import { describe, expect, it } from 'vitest'
import { decodeEditableText } from './textFile'

const bytes = (...values: number[]) => Uint8Array.from(values)

describe('decodeEditableText', () => {
  it('reads UTF-8 text, including emoji and other languages', () => {
    const text = 'héllo 😀 قصة\n'
    expect(decodeEditableText(new TextEncoder().encode(text))).toBe(text)
  })

  it('keeps a byte order mark, so saving does not change the file', () => {
    expect(decodeEditableText(bytes(0xef, 0xbb, 0xbf, 0x61))).toBe('﻿a')
  })

  it('reads an empty file', () => {
    expect(decodeEditableText(bytes())).toBe('')
  })

  it('refuses binary files, because saving them would corrupt them', () => {
    expect(decodeEditableText(bytes(0, 1, 2, 255, 254, 0, 65, 66))).toBeNull()
  })

  it('refuses text in other encodings, which saving as UTF-8 would damage', () => {
    expect(decodeEditableText(bytes(0x63, 0x61, 0x66, 0xe9))).toBeNull()
    expect(decodeEditableText(bytes(0xff, 0xfe, 0x61, 0x00))).toBeNull()
  })
})
