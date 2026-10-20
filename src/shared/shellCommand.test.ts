import { describe, expect, it } from 'vitest'
import { commandWithArguments, quoteShellArgument, runOnceArguments, shellKindOf } from './shellCommand'

describe('quoteShellArgument', () => {
  it('quotes an argument so the shell passes it through unchanged', () => {
    expect(quoteShellArgument('--no-daemon', 'powershell')).toBe("'--no-daemon'")
    expect(quoteShellArgument("it's; rm -rf $HOME", 'powershell')).toBe("'it''s; rm -rf $HOME'")
    expect(quoteShellArgument("it's; rm -rf $HOME", 'posix')).toBe("'it'\\''s; rm -rf $HOME'")
  })
})

describe('commandWithArguments', () => {
  it('adds quoted arguments after the command', () => {
    expect(commandWithArguments('codex', ['--no-daemon', '-c', 'model="o3"'], 'powershell')).toBe(
      "codex '--no-daemon' '-c' 'model=\"o3\"'"
    )
    expect(commandWithArguments('claude --session-id 1', [], 'posix')).toBe('claude --session-id 1')
  })
})

describe('runOnceArguments', () => {
  it('runs one command and lets the shell exit with it', () => {
    expect(runOnceArguments('codex', 'powershell')).toEqual(['-NoLogo', '-Command', 'codex'])
    expect(runOnceArguments('codex', 'posix')).toEqual(['-c', 'codex'])
    expect(shellKindOf('win32')).toBe('powershell')
    expect(shellKindOf('linux')).toBe('posix')
  })
})
