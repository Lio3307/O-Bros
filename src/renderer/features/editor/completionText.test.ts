import { describe, expect, it } from 'vitest'
import { pathQueryOf, wordBefore, wordsIn } from './completionText'

describe('wordsIn', () => {
  it('collects each name once, skipping short words and numbers', () => {
    expect(wordsIn('const totalPrice = 42 + totalPrice * tax_rate; $store.go(1)')).toEqual(['const', 'totalPrice', 'tax_rate', '$store'])
  })

  it('reads words from any language, including letters with accents', () => {
    expect(wordsIn('# Überblick\nkey: värde')).toEqual(['Überblick', 'key', 'värde'])
  })
})

describe('wordBefore', () => {
  it('returns the part of the word left of the cursor', () => {
    expect(wordBefore('  return total')).toBe('total')
    expect(wordBefore('call(')).toBe('')
  })
})

describe('pathQueryOf', () => {
  it('splits a relative path into the folder to list and the name being typed', () => {
    expect(pathQueryOf('./components/But')).toEqual({ folderPart: './components/', namePart: 'But' })
    expect(pathQueryOf('../')).toEqual({ folderPart: '../', namePart: '' })
    expect(pathQueryOf('.\\src\\ma')).toEqual({ folderPart: './src/', namePart: 'ma' })
  })

  it('ignores text that is not a path', () => {
    expect(pathQueryOf('hello world')).toBeNull()
    expect(pathQueryOf('react')).toBeNull()
    expect(pathQueryOf('/usr/lo')).toBeNull()
  })
})
