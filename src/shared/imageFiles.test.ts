import { describe, expect, it } from 'vitest'
import { imageTypeOf, imageTypeOfBytes } from './imageFiles'

describe('imageTypeOf', () => {
  it('knows image files by their extension, in any case', () => {
    expect(imageTypeOf('C:\\project\\logo.PNG')).toBe('image/png')
    expect(imageTypeOf('/project/icon.svg')).toBe('image/svg+xml')
  })

  it('leaves other files to the editor', () => {
    expect(imageTypeOf('/project/main.ts')).toBeNull()
    expect(imageTypeOf('/project/.png')).toBeNull()
  })
})

describe('imageTypeOfBytes', () => {
  it('knows images by their first bytes, for files without an extension', () => {
    expect(imageTypeOfBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00]))).toBe('image/jpeg')
    expect(imageTypeOfBytes(Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a]))).toBe('image/png')
    expect(imageTypeOfBytes(new TextEncoder().encode('RIFF\u0000\u0000\u0000\u0000WEBPVP8 '))).toBe('image/webp')
  })

  it('refuses anything else', () => {
    expect(imageTypeOfBytes(new TextEncoder().encode('just text'))).toBeNull()
    expect(imageTypeOfBytes(new Uint8Array())).toBeNull()
  })
})
