import { LanguageDescription } from '@codemirror/language'
import { languages as CATALOG_LANGUAGES } from '@codemirror/language-data'
import type { Extension } from '@codemirror/state'
import { fileExtension, lastPathSegment } from '../../../shared/paths'
import { interpreterOf, looksLikeMarkup } from './languageFromContent'

export const LANGUAGE_IDS = [
  'javascript',
  'typescript',
  'json',
  'css',
  'html',
  'markdown',
  'cpp',
  'python',
  'rust',
  'go',
  'java',
  'php',
  'sql',
  'yaml',
  'svelte',
  'astro',
  'env',
  'text',
  'other'
] as const

export type LanguageId = (typeof LANGUAGE_IDS)[number]

export interface LanguageDefinition {
  id: LanguageId
  label: string
  extensions: string[]
  matchesFileName?: (fileName: string) => boolean
  serverLanguageId?: string
  canLint: boolean
  canFormat: boolean
  load: () => Promise<Extension>
}

async function loadComponentLanguage(): Promise<Extension> {
  const [{ html }, { cssLanguage }] = await Promise.all([import('@codemirror/lang-html'), import('@codemirror/lang-css')])
  const otherStyleLanguages = ['scss', 'less', 'postcss']
  return html({
    nestedLanguages: [{ tag: 'style', attrs: (attrs) => otherStyleLanguages.includes(attrs.lang), parser: cssLanguage.parser }]
  })
}

function componentLanguage(id: LanguageId, label: string, extension: string): LanguageDefinition {
  return { id, label, extensions: [extension], canLint: false, canFormat: false, load: loadComponentLanguage }
}

export const LANGUAGES: LanguageDefinition[] = [
  {
    id: 'javascript',
    label: 'JavaScript',
    extensions: ['js', 'jsx', 'mjs', 'cjs'],
    canLint: true,
    canFormat: true,
    load: async () => (await import('@codemirror/lang-javascript')).javascript({ jsx: true })
  },
  {
    id: 'typescript',
    label: 'TypeScript',
    extensions: ['ts', 'tsx', 'mts', 'cts'],
    canLint: true,
    canFormat: true,
    load: async () => (await import('@codemirror/lang-javascript')).javascript({ jsx: true, typescript: true })
  },
  {
    id: 'json',
    label: 'JSON',
    extensions: ['json'],
    canLint: false,
    canFormat: true,
    load: async () => (await import('@codemirror/lang-json')).json()
  },
  {
    id: 'css',
    label: 'CSS',
    extensions: ['css'],
    canLint: false,
    canFormat: true,
    load: async () => (await import('@codemirror/lang-css')).css()
  },
  {
    id: 'html',
    label: 'HTML',
    extensions: ['html', 'htm'],
    canLint: false,
    canFormat: true,
    load: async () => (await import('@codemirror/lang-html')).html()
  },
  {
    id: 'markdown',
    label: 'Markdown',
    extensions: ['md', 'markdown'],
    canLint: false,
    canFormat: true,
    load: async () => (await import('@codemirror/lang-markdown')).markdown()
  },
  {
    id: 'cpp',
    label: 'C / C++',
    extensions: ['c', 'h', 'cc', 'cpp', 'cxx', 'hpp', 'hh', 'hxx'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('@codemirror/lang-cpp')).cpp()
  },
  {
    id: 'python',
    label: 'Python',
    extensions: ['py', 'pyw'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('@codemirror/lang-python')).python()
  },
  {
    id: 'rust',
    label: 'Rust',
    extensions: ['rs'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('@codemirror/lang-rust')).rust()
  },
  {
    id: 'go',
    label: 'Go',
    extensions: ['go'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('@codemirror/lang-go')).go()
  },
  {
    id: 'java',
    label: 'Java',
    extensions: ['java'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('@codemirror/lang-java')).java()
  },
  {
    id: 'php',
    label: 'PHP',
    extensions: ['php'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('@codemirror/lang-php')).php()
  },
  {
    id: 'sql',
    label: 'SQL',
    extensions: ['sql'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('@codemirror/lang-sql')).sql()
  },
  {
    id: 'yaml',
    label: 'YAML',
    extensions: ['yml', 'yaml'],
    canLint: false,
    canFormat: true,
    load: async () => (await import('@codemirror/lang-yaml')).yaml()
  },
  componentLanguage('svelte', 'Svelte', 'svelte'),
  componentLanguage('astro', 'Astro', 'astro'),
  {
    id: 'env',
    label: 'Environment and config',
    extensions: ['env', 'properties', 'ini', 'conf', 'cfg'],
    matchesFileName: (fileName) => fileName === '.env' || fileName.startsWith('.env.'),
    canLint: false,
    canFormat: false,
    load: async () => (await import('./plainTextLanguages')).envLanguage
  },
  {
    id: 'text',
    label: 'Plain text and logs',
    extensions: ['txt', 'text', 'log'],
    canLint: false,
    canFormat: false,
    load: async () => (await import('./plainTextLanguages')).textLanguage
  }
]

function isBuiltInExtension(extension: string): boolean {
  return LANGUAGES.some((language) => language.extensions.includes(extension))
}

export const OTHER_LANGUAGE_NAMES = CATALOG_LANGUAGES.filter((description) => !description.extensions.some(isBuiltInExtension)).map(
  (description) => description.name
)

function catalogLanguage(description: LanguageDescription): LanguageDefinition {
  return {
    id: 'other',
    label: description.name,
    extensions: [...description.extensions],
    serverLanguageId: description.name.toLowerCase(),
    canLint: false,
    canFormat: false,
    load: () => description.load()
  }
}

function languageFromFirstLine(firstLine: string): LanguageDefinition | null {
  const interpreter = interpreterOf(firstLine)
  const description = interpreter === null ? null : LanguageDescription.matchLanguageName(CATALOG_LANGUAGES, interpreter, true)
  if (description !== null) {
    const builtIn = LANGUAGES.find((language) => language.id === description.name.toLowerCase())
    return builtIn === undefined ? catalogLanguage(description) : { ...builtIn, canLint: false, canFormat: false }
  }
  return looksLikeMarkup(firstLine) ? { ...findLanguageById('html'), canFormat: false } : null
}

export function findLanguageForFile(filePath: string, firstLine = ''): LanguageDefinition | null {
  const extension = fileExtension(filePath)
  const fileName = lastPathSegment(filePath)
  const matches = (language: LanguageDefinition): boolean =>
    language.extensions.includes(extension) || (language.matchesFileName?.(fileName.toLowerCase()) ?? false)
  const builtIn = LANGUAGES.find(matches)
  if (builtIn !== undefined) {
    return builtIn
  }
  const listed = LanguageDescription.matchFilename(CATALOG_LANGUAGES, fileName)
  return listed === null ? languageFromFirstLine(firstLine) : catalogLanguage(listed)
}

export function findLanguageById(id: LanguageId): LanguageDefinition {
  const language = LANGUAGES.find((candidate) => candidate.id === id)
  if (language === undefined) {
    throw new Error(`Unknown language ${id}`)
  }
  return language
}
