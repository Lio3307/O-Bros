import { describe, expect, it } from 'vitest'
import { cn } from './cn'

describe('cn', () => {
  it('joins the class names that are set and skips the rest', () => {
    const isSelected = true
    const isDisabled = false
    expect(cn('row', isSelected && 'row-selected', isDisabled && 'row-disabled', undefined, null, '')).toBe('row row-selected')
  })

  it('returns no class attribute when nothing is set', () => {
    expect(cn(undefined, false)).toBeUndefined()
  })
})
