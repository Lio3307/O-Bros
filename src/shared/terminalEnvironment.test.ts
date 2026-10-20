import { describe, expect, it } from 'vitest'
import { cleanTerminalEnvironment } from './terminalEnvironment'

describe('cleanTerminalEnvironment', () => {
  it('drops agent homes and the session of the terminal app that started O-BROS', () => {
    const cleaned = cleanTerminalEnvironment({
      Path: 'C:\\Windows',
      USERPROFILE: 'C:\\Users\\me',
      CODEX_HOME: 'C:\\Users\\me\\AppData\\Roaming\\orca\\codex-runtime-home\\home',
      claude_config_dir: 'C:\\somewhere',
      ORCA_AGENT_HOOK_TOKEN: 'secret',
      ORCA_CODEX_HOME: 'C:\\x',
      TERM_PROGRAM: 'Orca',
      TERM_PROGRAM_VERSION: '1.4.218',
      ORCHESTRA: 'kept'
    })
    expect(cleaned).toEqual({ Path: 'C:\\Windows', USERPROFILE: 'C:\\Users\\me', ORCHESTRA: 'kept' })
  })
})
