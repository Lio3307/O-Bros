import { describe, expect, it } from 'vitest'
import { isHexColor, normalizeHexColor } from './hexColor'
import { palettesFromThemeFile, parseSimpleYaml } from './themeImport'
import { themeIdOf } from './themePalette'

const WARP_THEME = `# Solarized, as Warp ships it
accent: '#268bd2'
background: '#002b36' # the base
details: darker
foreground: '#839496'
terminal_colors:
  bright:
    black: '#002b36'
    blue: '#839496'
    cyan: '#93a1a1'
    green: '#586e75'
    magenta: '#6c71c4'
    red: '#cb4b16'
    white: '#fdf6e3'
    yellow: '#657b83'
  normal:
    black: '#073642'
    blue: '#268bd2'
    cyan: '#2aa198'
    green: '#859900'
    magenta: '#d33682'
    red: '#dc322f'
    white: '#eee8d5'
    yellow: '#b58900'
`

const ALACRITTY_THEME = `colors:
  primary:
    background: '0x1e1e2e'
    foreground: "0xcdd6f4"
  cursor:
    cursor: '0xf5e0dc'
  normal:
    black: '0x45475a'
    red: '0xf38ba8'
    green: '0xa6e3a1'
    yellow: '0xf9e2af'
    blue: '0x89b4fa'
    magenta: '0xf5c2e7'
    cyan: '0x94e2d5'
    white: '0xbac2de'
  bright:
    black: '0x585b70'
    red: '0xf38ba8'
    green: '0xa6e3a1'
    yellow: '0xf9e2af'
    blue: '0x89b4fa'
    magenta: '0xf5c2e7'
    cyan: '0x94e2d5'
    white: '0xa6adc8'
`

const WINDOWS_TERMINAL_SCHEME = {
  name: 'Campbell',
  background: '#0C0C0C',
  foreground: '#CCCCCC',
  cursorColor: '#FFFFFF',
  selectionBackground: '#FFFFFF',
  black: '#0C0C0C',
  red: '#C50F1F',
  green: '#13A10E',
  yellow: '#C19C00',
  blue: '#0037DA',
  purple: '#881798',
  cyan: '#3A96DD',
  white: '#CCCCCC',
  brightBlack: '#767676',
  brightRed: '#E74856',
  brightGreen: '#16C60C',
  brightYellow: '#F9F1A5',
  brightBlue: '#3B78FF',
  brightPurple: '#B4009E',
  brightCyan: '#61D6D6',
  brightWhite: '#F2F2F2'
}

describe('normalizeHexColor', () => {
  it('accepts the color spellings theme files use', () => {
    expect(normalizeHexColor('#ABCDEF')).toBe('#abcdef')
    expect(normalizeHexColor('#abc')).toBe('#aabbcc')
    expect(normalizeHexColor('#11223344')).toBe('#112233')
    expect(normalizeHexColor('0x1E1E2E')).toBe('#1e1e2e')
  })

  it('refuses anything that is not a plain color', () => {
    expect(normalizeHexColor('red')).toBeNull()
    expect(normalizeHexColor('#12345')).toBeNull()
    expect(normalizeHexColor('#12345g')).toBeNull()
    expect(normalizeHexColor('url(x)')).toBeNull()
    expect(normalizeHexColor(12)).toBeNull()
  })

  it('isHexColor only allows full #rrggbb or #rrggbbaa', () => {
    expect(isHexColor('#000000')).toBe(true)
    expect(isHexColor('#00000000')).toBe(true)
    expect(isHexColor('#000')).toBe(false)
    expect(isHexColor('#00000;x')).toBe(false)
    expect(isHexColor(undefined)).toBe(false)
  })
})

describe('parseSimpleYaml', () => {
  it('reads nested maps, quotes and comments', () => {
    const parsed = parseSimpleYaml(WARP_THEME)
    expect(parsed.background).toBe('#002b36')
    expect(parsed.details).toBe('darker')
    expect((parsed.terminal_colors as Record<string, Record<string, string>>).normal.magenta).toBe('#d33682')
  })

  it('keeps an unquoted color that YAML would read as a comment', () => {
    expect(parseSimpleYaml('background: #102030\nname: "Mine: dark" # note').background).toBe('#102030')
    expect(parseSimpleYaml('name: "Mine: dark" # note').name).toBe('Mine: dark')
  })

  it('ignores lines it does not understand', () => {
    expect(parseSimpleYaml('---\n- item\njust text\n  : nothing\n')).toEqual({})
  })
})

describe('palettesFromThemeFile', () => {
  it('reads a Warp theme, named after its file', () => {
    const [palette] = palettesFromThemeFile(WARP_THEME, 'C:\\themes\\standard\\solarized_dark.yaml')
    expect(palette.label).toBe('Solarized Dark')
    expect(palette.background).toBe('#002b36')
    expect(palette.ansi).toHaveLength(16)
    expect(palette.ansi[5]).toBe('#d33682')
    expect(palette.ansi[13]).toBe('#6c71c4')
    expect(palette.cursor).toBe('#268bd2')
  })

  it('reads an Alacritty theme with 0x colors', () => {
    const [palette] = palettesFromThemeFile(ALACRITTY_THEME, 'catppuccin-mocha.yml')
    expect(palette.label).toBe('Catppuccin Mocha')
    expect(palette.background).toBe('#1e1e2e')
    expect(palette.cursor).toBe('#f5e0dc')
    expect(palette.ansi[0]).toBe('#45475a')
  })

  it('reads a Windows Terminal scheme, and every scheme in a settings file', () => {
    const [single] = palettesFromThemeFile(JSON.stringify(WINDOWS_TERMINAL_SCHEME), 'campbell.json')
    expect(single.label).toBe('Campbell')
    expect(single.ansi[5]).toBe('#881798')
    expect(single.ansi[13]).toBe('#b4009e')

    const settings = { profiles: {}, schemes: [WINDOWS_TERMINAL_SCHEME, { ...WINDOWS_TERMINAL_SCHEME, name: 'Campbell Copy' }] }
    expect(palettesFromThemeFile(JSON.stringify(settings), 'settings.json').map((palette) => palette.label)).toEqual([
      'Campbell',
      'Campbell Copy'
    ])
  })

  it('returns nothing for files that are not themes, broken or too large', () => {
    expect(palettesFromThemeFile('{ broken json', 'x.json')).toEqual([])
    expect(palettesFromThemeFile('name: Half\nbackground: "#000000"\n', 'half.yaml')).toEqual([])
    expect(palettesFromThemeFile(JSON.stringify({ ...WINDOWS_TERMINAL_SCHEME, red: 'tomato' }), 'bad.json')).toEqual([])
    expect(palettesFromThemeFile('a'.repeat(600 * 1024), 'huge.yaml')).toEqual([])
  })
})

describe('themeIdOf', () => {
  it('makes a readable id from any name', () => {
    expect(themeIdOf('Catppuccin Frappé')).toBe('catppuccin-frappe')
    expect(themeIdOf('  Rose   Pine (Moon)!')).toBe('rose-pine-moon')
  })
})
