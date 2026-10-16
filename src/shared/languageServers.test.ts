import { describe, expect, it } from 'vitest'
import { lspLanguageIdOf, parseLanguageServers, pickServerFor, splitCommandLine, type LanguageServerStatus } from './languageServers'

function status(id: string, languages: string[], source: LanguageServerStatus['source']): LanguageServerStatus {
  return { id, title: id, languages, command: id, args: [], projectLocal: false, install: '', source, resolvedPath: source === null ? null : id }
}

describe('language servers', () => {
  it('reads valid server entries and skips broken ones', () => {
    const servers = parseLanguageServers({
      servers: [
        { id: 'ts', title: 'TS', languages: ['typescript'], command: 'tsls', args: ['--stdio'], projectLocal: true },
        { id: 'bad', title: 'Bad', languages: 'python', command: 'x', args: [] },
        { id: 'empty', title: 'Empty', languages: [], command: '  ', args: [] }
      ]
    })
    expect(servers.map((server) => server.id)).toEqual(['ts'])
    expect(servers[0]).toMatchObject({ projectLocal: true, install: '' })
  })

  it('gives React and C files their own language id', () => {
    expect(lspLanguageIdOf('C:/app/App.tsx', 'typescript')).toBe('typescriptreact')
    expect(lspLanguageIdOf('/app/view.jsx', 'javascript')).toBe('javascriptreact')
    expect(lspLanguageIdOf('/app/main.c', 'cpp')).toBe('c')
    expect(lspLanguageIdOf('/app/main.ts', 'typescript')).toBe('typescript')
  })

  it('splits a custom command with quotes', () => {
    expect(splitCommandLine('  "C:/Program Files/tsls/tsls.cmd" --stdio --log-level 2 ')).toEqual([
      'C:/Program Files/tsls/tsls.cmd',
      '--stdio',
      '--log-level',
      '2'
    ])
    expect(splitCommandLine("pylsp -v ''")).toEqual(['pylsp', '-v', ''])
  })

  it('picks the first installed and enabled server for a language', () => {
    const statuses = [status('missing', ['python'], null), status('pyright', ['python'], 'path'), status('pylsp', ['python'], 'path')]
    expect(pickServerFor('python', statuses, {})?.id).toBe('pyright')
    expect(pickServerFor('python', statuses, { pyright: { isEnabled: false, customCommand: null } })?.id).toBe('pylsp')
    expect(pickServerFor('rust', statuses, {})).toBeNull()
  })
})
