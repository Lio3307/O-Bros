import { normalizeHexColor } from './hexColor'
import { isRecord } from './isRecord'
import type { ThemePalette } from './themePalette'

export type ImportedPalette = Omit<ThemePalette, 'id'>

export interface ThemeFile {
  name: string
  content: string
}

export interface WarpThemeFiles {
  searched: string[]
  folders: string[]
  files: ThemeFile[]
}

export const MAX_THEME_FILE_CHARACTERS = 512 * 1024
const MAX_LABEL_LENGTH = 60
const ANSI_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white']
const WINDOWS_TERMINAL_ALIASES: Record<string, string> = { magenta: 'purple' }
const QUOTES = ['"', "'"]
const IGNORED_LINE_STARTS = ['#', '---', '...', '- ']

interface YamlLine {
  indent: number
  key: string
  value: string
}

function unquote(text: string): string {
  const quote = text.charAt(0)
  if (text.length >= 2 && QUOTES.includes(quote) && text.endsWith(quote)) {
    const inner = text.slice(1, -1)
    return quote === "'" ? inner.split("''").join("'") : inner
  }
  return text
}

function withoutComment(text: string): string {
  let openQuote: string | null = null
  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index)
    if (openQuote !== null) {
      openQuote = character === openQuote ? null : openQuote
    } else if (QUOTES.includes(character)) {
      openQuote = character
    } else if (character === '#' && (index === 0 || text.charAt(index - 1) === ' ')) {
      const rest = text.slice(index).split(' ')[0]
      return normalizeHexColor(rest) !== null && text.slice(0, index).trim() === '' ? rest : text.slice(0, index)
    }
  }
  return text
}

function keySeparatorIndex(text: string): number {
  let openQuote: string | null = null
  for (let index = 0; index < text.length; index += 1) {
    const character = text.charAt(index)
    if (openQuote !== null) {
      openQuote = character === openQuote ? null : openQuote
    } else if (QUOTES.includes(character)) {
      openQuote = character
    } else if (character === ':' && (index === text.length - 1 || text.charAt(index + 1) === ' ')) {
      return index
    }
  }
  return -1
}

function yamlLineOf(rawLine: string): YamlLine | null {
  const line = rawLine.endsWith('\r') ? rawLine.slice(0, -1) : rawLine
  const trimmed = line.trim()
  if (trimmed === '' || IGNORED_LINE_STARTS.some((start) => trimmed.startsWith(start))) {
    return null
  }
  const separator = keySeparatorIndex(trimmed)
  if (separator <= 0) {
    return null
  }
  return {
    indent: line.length - line.trimStart().length,
    key: unquote(trimmed.slice(0, separator).trim()).toLowerCase(),
    value: unquote(withoutComment(trimmed.slice(separator + 1)).trim())
  }
}

export function parseSimpleYaml(text: string): Record<string, unknown> {
  const root: Record<string, unknown> = {}
  const parents: { indent: number; map: Record<string, unknown> }[] = [{ indent: -1, map: root }]
  for (const rawLine of text.split('\n')) {
    const line = yamlLineOf(rawLine)
    if (line === null) {
      continue
    }
    while (parents[parents.length - 1].indent >= line.indent) {
      parents.pop()
    }
    const parent = parents[parents.length - 1].map
    if (line.value === '') {
      const child: Record<string, unknown> = {}
      parent[line.key] = child
      parents.push({ indent: line.indent, map: child })
    } else {
      parent[line.key] = line.value
    }
  }
  return root
}

function fieldOf(source: unknown, ...path: string[]): unknown {
  let current = source
  for (const name of path) {
    if (!isRecord(current)) {
      return undefined
    }
    const key = Object.keys(current).find((candidate) => candidate.toLowerCase() === name.toLowerCase())
    current = key === undefined ? undefined : current[key]
  }
  return current
}

function colorOf(source: unknown, ...path: string[]): string | null {
  return normalizeHexColor(fieldOf(source, ...path))
}

function ansiOf(normal: unknown, bright: unknown): string[] | null {
  const colors = [normal, bright].flatMap((group) => ANSI_NAMES.map((name) => colorOf(group, name)))
  return colors.every((color) => color !== null) ? (colors as string[]) : null
}

function windowsTerminalAnsiOf(scheme: unknown): string[] | null {
  const names = ANSI_NAMES.map((name) => WINDOWS_TERMINAL_ALIASES[name] ?? name)
  const brightNames = names.map((name) => `bright${name.charAt(0).toUpperCase()}${name.slice(1)}`)
  const colors = [...names, ...brightNames].map((name) => colorOf(scheme, name))
  return colors.every((color) => color !== null) ? (colors as string[]) : null
}

function labelOf(name: unknown, fileName: string): string {
  const fromFile = fileName.split('/').pop()?.split('\\').pop() ?? fileName
  const withoutExtension = fromFile.includes('.') ? fromFile.slice(0, fromFile.lastIndexOf('.')) : fromFile
  const fallback = withoutExtension
    .split('_')
    .join(' ')
    .split('-')
    .join(' ')
    .split(' ')
    .filter((word) => word !== '')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')
  const label = typeof name === 'string' && name.trim() !== '' ? name.trim() : fallback
  return (label === '' ? 'Imported theme' : label).slice(0, MAX_LABEL_LENGTH)
}

function paletteOf(
  label: string,
  background: string | null,
  foreground: string | null,
  ansi: string[] | null,
  cursor: string | null,
  selection: string | null
): ImportedPalette | null {
  if (background === null || foreground === null || ansi === null) {
    return null
  }
  return { label, background, foreground, ansi, cursor: cursor ?? foreground, selection: selection ?? ansi[8] }
}

function fromWarp(record: Record<string, unknown>, fileName: string): ImportedPalette | null {
  return paletteOf(
    labelOf(fieldOf(record, 'name'), fileName),
    colorOf(record, 'background'),
    colorOf(record, 'foreground'),
    ansiOf(fieldOf(record, 'terminal_colors', 'normal'), fieldOf(record, 'terminal_colors', 'bright')),
    colorOf(record, 'cursor') ?? colorOf(record, 'accent'),
    colorOf(record, 'accent')
  )
}

function fromAlacritty(record: Record<string, unknown>, fileName: string): ImportedPalette | null {
  return paletteOf(
    labelOf(fieldOf(record, 'name'), fileName),
    colorOf(record, 'colors', 'primary', 'background'),
    colorOf(record, 'colors', 'primary', 'foreground'),
    ansiOf(fieldOf(record, 'colors', 'normal'), fieldOf(record, 'colors', 'bright')),
    colorOf(record, 'colors', 'cursor', 'cursor'),
    colorOf(record, 'colors', 'selection', 'background')
  )
}

function fromWindowsTerminal(scheme: unknown, fileName: string): ImportedPalette | null {
  return paletteOf(
    labelOf(fieldOf(scheme, 'name'), fileName),
    colorOf(scheme, 'background'),
    colorOf(scheme, 'foreground'),
    windowsTerminalAnsiOf(scheme),
    colorOf(scheme, 'cursorColor'),
    colorOf(scheme, 'selectionBackground')
  )
}

function parsedContent(text: string): unknown {
  const trimmed = text.trim()
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      return JSON.parse(trimmed)
    } catch {
      return null
    }
  }
  return parseSimpleYaml(text)
}

export function palettesFromThemeFile(text: string, fileName: string): ImportedPalette[] {
  if (text.length > MAX_THEME_FILE_CHARACTERS) {
    return []
  }
  const content = parsedContent(text)
  const schemes = fieldOf(content, 'schemes')
  const candidates: unknown[] = Array.isArray(content) ? content : Array.isArray(schemes) ? schemes : [content]
  return candidates
    .filter(isRecord)
    .map((candidate) => fromWarp(candidate, fileName) ?? fromAlacritty(candidate, fileName) ?? fromWindowsTerminal(candidate, fileName))
    .filter((palette) => palette !== null)
}
