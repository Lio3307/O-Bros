import type { Extension } from '@codemirror/state'
import { fileExtension } from '../../../shared/paths'

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
  'yaml'
] as const

export type LanguageId = (typeof LANGUAGE_IDS)[number]

export interface LanguageDefinition {
  id: LanguageId
  label: string
  extensions: string[]
  canLint: boolean
  canFormat: boolean
  load: () => Promise<Extension>
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
  }
]

export function findLanguageForFile(filePath: string): LanguageDefinition | null {
  const extension = fileExtension(filePath)
  return LANGUAGES.find((language) => language.extensions.includes(extension)) ?? null
}

export function findLanguageById(id: LanguageId): LanguageDefinition {
  const language = LANGUAGES.find((candidate) => candidate.id === id)
  if (language === undefined) {
    throw new Error(`Unknown language ${id}`)
  }
  return language
}
