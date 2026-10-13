import { DEFAULT_SNIPPETS, type Snippet } from './defaultSnippets'
import { LANGUAGE_IDS, type LanguageId } from './languageRegistry'

export type LintMode = 'off' | 'on-save' | 'as-you-type'

export const LINT_MODES: LintMode[] = ['off', 'on-save', 'as-you-type']

export const AUTO_SAVE_MIN_DELAY_MS = 100
export const AUTO_SAVE_MAX_DELAY_MS = 60_000
export const AUTO_SAVE_DEFAULT_DELAY_MS = 1000
export const AUTO_SAVE_DELAY_PRESETS_MS = [200, 500, 1000, 2000, 5000]

export interface EditorSettings {
  disabledLanguages: LanguageId[]
  lintMode: LintMode
  formatOnSave: boolean
  autoSaveEnabled: boolean
  autoSaveDelayMs: number
  snippets: Record<LanguageId, Snippet[]>
}

export function defaultSnippetsFor(id: LanguageId): Snippet[] {
  return DEFAULT_SNIPPETS[id].map((snippet) => ({ ...snippet }))
}

export function defaultEditorSettings(): EditorSettings {
  const snippets = {} as Record<LanguageId, Snippet[]>
  for (const id of LANGUAGE_IDS) {
    snippets[id] = defaultSnippetsFor(id)
  }
  return {
    disabledLanguages: [],
    lintMode: 'on-save',
    formatOnSave: false,
    autoSaveEnabled: false,
    autoSaveDelayMs: AUTO_SAVE_DEFAULT_DELAY_MS,
    snippets
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function isLanguageId(value: unknown): value is LanguageId {
  return LANGUAGE_IDS.includes(value as LanguageId)
}

export function clampAutoSaveDelay(delayMs: number): number {
  if (!Number.isFinite(delayMs)) {
    return AUTO_SAVE_DEFAULT_DELAY_MS
  }
  return Math.min(Math.max(Math.round(delayMs), AUTO_SAVE_MIN_DELAY_MS), AUTO_SAVE_MAX_DELAY_MS)
}

function isLintMode(value: unknown): value is LintMode {
  return LINT_MODES.includes(value as LintMode)
}

function toSnippet(value: unknown): Snippet | null {
  if (!isRecord(value) || typeof value.prefix !== 'string' || typeof value.body !== 'string') {
    return null
  }
  const description = typeof value.description === 'string' ? value.description : ''
  return { prefix: value.prefix, description, body: value.body }
}

function toSnippetList(value: unknown, fallback: Snippet[]): Snippet[] {
  if (!Array.isArray(value)) {
    return fallback
  }
  return value.map(toSnippet).filter((snippet): snippet is Snippet => snippet !== null)
}

export function normalizeEditorSettings(raw: unknown): EditorSettings {
  const defaults = defaultEditorSettings()
  if (!isRecord(raw)) {
    return defaults
  }

  const disabledLanguages = Array.isArray(raw.disabledLanguages) ? raw.disabledLanguages.filter(isLanguageId) : []
  const savedSnippets = isRecord(raw.snippets) ? raw.snippets : {}
  const snippets = { ...defaults.snippets }
  for (const id of LANGUAGE_IDS) {
    snippets[id] = toSnippetList(savedSnippets[id], defaults.snippets[id])
  }

  return {
    disabledLanguages,
    lintMode: isLintMode(raw.lintMode) ? raw.lintMode : defaults.lintMode,
    formatOnSave: typeof raw.formatOnSave === 'boolean' ? raw.formatOnSave : defaults.formatOnSave,
    autoSaveEnabled: typeof raw.autoSaveEnabled === 'boolean' ? raw.autoSaveEnabled : defaults.autoSaveEnabled,
    autoSaveDelayMs:
      typeof raw.autoSaveDelayMs === 'number' ? clampAutoSaveDelay(raw.autoSaveDelayMs) : defaults.autoSaveDelayMs,
    snippets
  }
}
