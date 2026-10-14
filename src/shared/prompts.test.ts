import { describe, expect, it } from 'vitest'
import { DEFAULT_PROMPTS, firstLineOf, isUsablePrompt, parsePrompts, searchPrompts } from './prompts'

describe('parsePrompts', () => {
  it('returns null when nothing is saved or the data is broken', () => {
    expect(parsePrompts(null)).toBeNull()
    expect(parsePrompts('not json')).toBeNull()
    expect(parsePrompts('{"a": 1}')).toBeNull()
  })

  it('keeps well formed prompts and drops the others', () => {
    const raw = JSON.stringify([{ id: '1', title: 'A', text: 'one' }, { id: 2 }, 'text'])
    expect(parsePrompts(raw)).toEqual([{ id: '1', title: 'A', text: 'one' }])
  })

  it('keeps an empty saved list so a user can clear all prompts', () => {
    expect(parsePrompts('[]')).toEqual([])
  })
})

describe('searchPrompts', () => {
  it('returns everything for an empty query', () => {
    expect(searchPrompts(DEFAULT_PROMPTS, '  ')).toHaveLength(DEFAULT_PROMPTS.length)
  })

  it('matches the title or the text without caring about case', () => {
    expect(searchPrompts(DEFAULT_PROMPTS, 'COMMIT MESSAGE').map((prompt) => prompt.id)).toEqual(['default-commit-message'])
    expect(searchPrompts(DEFAULT_PROMPTS, 'edge cases').map((prompt) => prompt.id)).toEqual(['default-write-tests'])
  })
})

describe('isUsablePrompt and firstLineOf', () => {
  it('needs both a title and a text', () => {
    expect(isUsablePrompt('Title', 'Text')).toBe(true)
    expect(isUsablePrompt(' ', 'Text')).toBe(false)
    expect(isUsablePrompt('Title', '')).toBe(false)
  })

  it('returns the first line of a prompt', () => {
    expect(firstLineOf('first\nsecond')).toBe('first')
    expect(firstLineOf('  only  ')).toBe('only')
  })
})
