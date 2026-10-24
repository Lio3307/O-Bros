import { describe, expect, it } from 'vitest'
import { imageTypeOf } from './imageFiles'

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
