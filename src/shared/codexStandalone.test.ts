import { describe, expect, it } from 'vitest'
import { withoutSharedServer } from './codexStandalone'

const NEW_HELP = '--no-daemon\n          Run without the shared background server, even if it is already running'

describe('withoutSharedServer', () => {
  it('starts a Codex member on its own when this Codex has a shared background server', () => {
    expect(withoutSharedServer([], NEW_HELP)).toEqual(['--no-daemon'])
    expect(withoutSharedServer(['-m', 'gpt-5'], NEW_HELP)).toEqual(['--no-daemon', '-m', 'gpt-5'])
  })

  it('does not add it twice, and leaves an older Codex without the option alone', () => {
    expect(withoutSharedServer(['--no-daemon'], NEW_HELP)).toEqual(['--no-daemon'])
    expect(withoutSharedServer(['-m', 'gpt-5'], 'Usage: codex [OPTIONS]')).toEqual(['-m', 'gpt-5'])
    expect(withoutSharedServer([], '')).toEqual([])
  })
})
