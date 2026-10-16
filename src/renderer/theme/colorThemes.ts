import type { ITheme } from '@xterm/xterm'
import { EXTRA_COLOR_THEMES } from './colorThemesExtra'

export type ColorThemeId = string

export const DEFAULT_COLOR_THEME_ID: ColorThemeId = 'o-bros'

export interface CodeColors {
  keyword: string
  string: string
  number: string
  comment: string
  functionName: string
  typeName: string
  property: string
  htmlTag: string
  attribute: string
  punctuation: string
  link: string
  variable: string
}

export interface ColorTheme {
  id: ColorThemeId
  label: string
  background: string
  foreground: string
  cursor: string
  selection: string
  code: CodeColors
  ansi: string[]
}

const ANSI_NAMES = [
  'black',
  'red',
  'green',
  'yellow',
  'blue',
  'magenta',
  'cyan',
  'white',
  'brightBlack',
  'brightRed',
  'brightGreen',
  'brightYellow',
  'brightBlue',
  'brightMagenta',
  'brightCyan',
  'brightWhite'
] as const

const BUILT_IN_COLOR_THEMES: ColorTheme[] = [
  {
    id: 'o-bros',
    label: 'O-BROS',
    background: '#000000',
    foreground: '#EDEDED',
    cursor: '#B8B8B8',
    selection: '#3A3A3A',
    code: {
      keyword: '#CF8E6D',
      string: '#6AAB73',
      number: '#2AACB8',
      comment: '#7A7E85',
      functionName: '#56A8F5',
      typeName: '#E8BF6A',
      property: '#C77DBB',
      htmlTag: '#E8BF6A',
      attribute: '#BCBEC4',
      punctuation: '#8C8C8C',
      link: '#56A8F5',
      variable: '#2AACB8'
    },
    ansi: [
      '#000000',
      '#CD3131',
      '#0DBC79',
      '#E5E510',
      '#2472C8',
      '#BC3FBC',
      '#11A8CD',
      '#E5E5E5',
      '#666666',
      '#F14C4C',
      '#23D18B',
      '#F5F543',
      '#3B8EEA',
      '#D670D6',
      '#29B8DB',
      '#FFFFFF'
    ]
  },
  {
    id: 'one-dark',
    label: 'One Dark',
    background: '#21252B',
    foreground: '#ABB2BF',
    cursor: '#528BFF',
    selection: '#3E4451',
    code: {
      keyword: '#C678DD',
      string: '#98C379',
      number: '#D19A66',
      comment: '#7F848E',
      functionName: '#61AFEF',
      typeName: '#E5C07B',
      property: '#E06C75',
      htmlTag: '#E06C75',
      attribute: '#D19A66',
      punctuation: '#ABB2BF',
      link: '#61AFEF',
      variable: '#56B6C2'
    },
    ansi: [
      '#21252B',
      '#E06C75',
      '#98C379',
      '#E5C07B',
      '#61AFEF',
      '#C678DD',
      '#56B6C2',
      '#ABB2BF',
      '#5C6370',
      '#E06C75',
      '#98C379',
      '#E5C07B',
      '#61AFEF',
      '#C678DD',
      '#56B6C2',
      '#FFFFFF'
    ]
  },
  {
    id: 'dracula',
    label: 'Dracula',
    background: '#282A36',
    foreground: '#F8F8F2',
    cursor: '#F8F8F2',
    selection: '#44475A',
    code: {
      keyword: '#FF79C6',
      string: '#F1FA8C',
      number: '#BD93F9',
      comment: '#6272A4',
      functionName: '#50FA7B',
      typeName: '#8BE9FD',
      property: '#FFB86C',
      htmlTag: '#FF79C6',
      attribute: '#50FA7B',
      punctuation: '#F8F8F2',
      link: '#8BE9FD',
      variable: '#FFB86C'
    },
    ansi: [
      '#21222C',
      '#FF5555',
      '#50FA7B',
      '#F1FA8C',
      '#BD93F9',
      '#FF79C6',
      '#8BE9FD',
      '#F8F8F2',
      '#6272A4',
      '#FF6E6E',
      '#69FF94',
      '#FFFFA5',
      '#D6ACFF',
      '#FF92DF',
      '#A4FFFF',
      '#FFFFFF'
    ]
  },
  {
    id: 'github-dark',
    label: 'GitHub Dark',
    background: '#0D1117',
    foreground: '#C9D1D9',
    cursor: '#58A6FF',
    selection: '#264F78',
    code: {
      keyword: '#FF7B72',
      string: '#A5D6FF',
      number: '#79C0FF',
      comment: '#8B949E',
      functionName: '#D2A8FF',
      typeName: '#FFA657',
      property: '#79C0FF',
      htmlTag: '#7EE787',
      attribute: '#79C0FF',
      punctuation: '#C9D1D9',
      link: '#58A6FF',
      variable: '#FFA657'
    },
    ansi: [
      '#484F58',
      '#FF7B72',
      '#3FB950',
      '#D29922',
      '#58A6FF',
      '#BC8CFF',
      '#39C5CF',
      '#B1BAC4',
      '#6E7681',
      '#FFA198',
      '#56D364',
      '#E3B341',
      '#79C0FF',
      '#D2A8FF',
      '#56D4DD',
      '#F0F6FC'
    ]
  },
  {
    id: 'monokai',
    label: 'Monokai',
    background: '#272822',
    foreground: '#F8F8F2',
    cursor: '#F8F8F0',
    selection: '#49483E',
    code: {
      keyword: '#F92672',
      string: '#E6DB74',
      number: '#AE81FF',
      comment: '#75715E',
      functionName: '#A6E22E',
      typeName: '#66D9EF',
      property: '#FD971F',
      htmlTag: '#F92672',
      attribute: '#A6E22E',
      punctuation: '#F8F8F2',
      link: '#66D9EF',
      variable: '#FD971F'
    },
    ansi: [
      '#272822',
      '#F92672',
      '#A6E22E',
      '#F4BF75',
      '#66D9EF',
      '#AE81FF',
      '#A1EFE4',
      '#F8F8F2',
      '#75715E',
      '#F92672',
      '#A6E22E',
      '#F4BF75',
      '#66D9EF',
      '#AE81FF',
      '#A1EFE4',
      '#F9F8F5'
    ]
  },
  {
    id: 'solarized-dark',
    label: 'Solarized Dark',
    background: '#002B36',
    foreground: '#93A1A1',
    cursor: '#93A1A1',
    selection: '#073642',
    code: {
      keyword: '#859900',
      string: '#2AA198',
      number: '#D33682',
      comment: '#586E75',
      functionName: '#268BD2',
      typeName: '#B58900',
      property: '#268BD2',
      htmlTag: '#268BD2',
      attribute: '#93A1A1',
      punctuation: '#839496',
      link: '#268BD2',
      variable: '#CB4B16'
    },
    ansi: [
      '#073642',
      '#DC322F',
      '#859900',
      '#B58900',
      '#268BD2',
      '#D33682',
      '#2AA198',
      '#EEE8D5',
      '#002B36',
      '#CB4B16',
      '#586E75',
      '#657B83',
      '#839496',
      '#6C71C4',
      '#93A1A1',
      '#FDF6E3'
    ]
  }
]

export const COLOR_THEMES: ColorTheme[] = [...BUILT_IN_COLOR_THEMES, ...EXTRA_COLOR_THEMES].sort((first, second) =>
  first.id === DEFAULT_COLOR_THEME_ID ? -1 : second.id === DEFAULT_COLOR_THEME_ID ? 1 : first.label.localeCompare(second.label)
)

export function findColorTheme(id: ColorThemeId): ColorTheme {
  return COLOR_THEMES.find((theme) => theme.id === id) ?? COLOR_THEMES[0]
}

export function isColorThemeId(value: unknown): value is ColorThemeId {
  return COLOR_THEMES.some((theme) => theme.id === value)
}

export function terminalThemeOf(theme: ColorTheme): ITheme {
  const ansiColors: Record<string, string> = {}
  ANSI_NAMES.forEach((name, index) => {
    ansiColors[name] = theme.ansi[index]
  })
  return {
    ...ansiColors,
    background: theme.background,
    foreground: theme.foreground,
    cursor: theme.cursor,
    cursorAccent: theme.background,
    selectionBackground: theme.selection
  }
}
