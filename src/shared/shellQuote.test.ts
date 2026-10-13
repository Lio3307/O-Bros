import { describe, expect, it } from 'vitest'
import { quotePathForShell } from './shellQuote'

describe('quotePathForShell', () => {
  it('leaves a simple path alone', () => {
    expect(quotePathForShell('C:/dev/app/index.ts')).toBe('C:/dev/app/index.ts')
  })

  it('wraps a path with spaces in double quotes', () => {
    expect(quotePathForShell('C:/My Projects/a.ts')).toBe('"C:/My Projects/a.ts"')
  })

  it('wraps a path with shell characters', () => {
    expect(quotePathForShell('/tmp/a&b.txt')).toBe('"/tmp/a&b.txt"')
  })
})
