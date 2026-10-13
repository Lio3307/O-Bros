import { describe, expect, it } from 'vitest'
import { resumeCommandFor } from './resumeCommand'

describe('resumeCommandFor', () => {
  it('uses the resume flag for Claude', () => {
    expect(resumeCommandFor('claude', 'abc-123')).toBe('claude --resume abc-123')
  })

  it('uses the resume subcommand for Codex', () => {
    expect(resumeCommandFor('codex', '019c453a-8678')).toBe('codex resume 019c453a-8678')
  })

  it('quotes an id that contains a space', () => {
    expect(resumeCommandFor('claude', 'my session')).toBe('claude --resume "my session"')
  })
})
