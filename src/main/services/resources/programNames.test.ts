import { describe, expect, it } from 'vitest'
import { commandTokens, distinctProgramNames, friendlyProgramName } from './programNames'

function entry(name: string, commandLine: string) {
  return { name, commandLine }
}

describe('friendlyProgramName', () => {
  it('uses the program name for real programs', () => {
    expect(friendlyProgramName(entry('claude.exe', '"C:\\Users\\me\\.local\\bin\\claude.exe"'))).toBe('claude')
    expect(friendlyProgramName(entry('Pencil.exe', 'C:\\Users\\me\\AppData\\Local\\Programs\\Pencil\\resources\\app.asar'))).toBe('Pencil')
  })

  it('looks through cmd, node and npx to the package or script they run', () => {
    expect(friendlyProgramName(entry('cmd.exe', 'C:\\WINDOWS\\system32\\cmd.exe /d /s /c "npx ^"@playwright/mcp@latest^""'))).toBe('@playwright/mcp')
    expect(
      friendlyProgramName(entry('node.exe', '"C:\\Program Files\\nodejs\\\\node.exe" "C:\\Program Files\\nodejs\\\\node_modules\\npm\\bin\\npx-cli.js" @playwright/mcp@latest'))
    ).toBe('@playwright/mcp')
    expect(friendlyProgramName(entry('cmd.exe', 'C:\\WINDOWS\\system32\\cmd.exe /d /s /c playwright-mcp'))).toBe('playwright-mcp')
    expect(friendlyProgramName(entry('node.exe', '"node" "C:\\Users\\me\\npm-cache\\_npx\\98\\node_modules\\.bin\\\\playwright-mcp"'))).toBe('playwright-mcp')
  })

  it('shows package manager scripts as the command people type', () => {
    expect(friendlyProgramName(entry('node.exe', '"C:\\Program Files\\nodejs\\node.exe" "C:\\Program Files\\nodejs\\node_modules\\npm\\bin\\npm-cli.js" run dev'))).toBe('npm run dev')
    expect(friendlyProgramName(entry('cmd.exe', 'cmd.exe /d /s /c npm run build -- --watch'))).toBe('npm run build')
  })

  it('has no name for a bare runtime', () => {
    expect(friendlyProgramName(entry('node.exe', 'node'))).toBeNull()
    expect(friendlyProgramName(entry('powershell.exe', 'powershell.exe -NoLogo'))).toBeNull()
  })
})

describe('distinctProgramNames', () => {
  it('lists each program once and leaves out the main one', () => {
    const names = distinctProgramNames(
      [entry('cmd.exe', 'cmd /c "npx @playwright/mcp@latest"'), entry('node.exe', 'node npx-cli.js @playwright/mcp@latest'), entry('Pencil.exe', 'Pencil'), entry('claude.exe', 'claude')],
      'Claude'
    )
    expect(names).toEqual(['@playwright/mcp', 'Pencil'])
  })

  it('keeps quoted paths with spaces together', () => {
    expect(commandTokens('"C:\\Program Files\\app.exe" --flag "a b"')).toEqual(['C:\\Program Files\\app.exe', '--flag', 'a', 'b'])
  })
})
