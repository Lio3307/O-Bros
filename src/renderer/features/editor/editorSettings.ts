import { LANGUAGE_IDS, type LanguageId } from './languageRegistry'
import { isRecord } from '../../../shared/isRecord'
import { normalizeHexColor } from '../../../shared/hexColor'

export type LintMode = 'off' | 'on-save' | 'as-you-type'

export const LINT_MODES: LintMode[] = ['off', 'on-save', 'as-you-type']

export type CursorShape = 'line' | 'block' | 'underline'

export const CURSOR_SHAPES: CursorShape[] = ['line', 'block', 'underline']

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
  vimMode: boolean
  cursorShape: CursorShape
  cursorColor: string | null
  cursorBlinks: boolean
  cursorGlides: boolean
}

export function defaultEditorSettings(): EditorSettings {
  return {
    disabledLanguages: [],
    lintMode: 'on-save',
    formatOnSave: false,
    autoSaveEnabled: false,
    autoSaveDelayMs: AUTO_SAVE_DEFAULT_DELAY_MS,
    vimMode: false,
    cursorShape: 'line',
    cursorColor: null,
    cursorBlinks: true,
    cursorGlides: false
  }
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

function isCursorShape(value: unknown): value is CursorShape {
  return CURSOR_SHAPES.includes(value as CursorShape)
}

function isLintMode(value: unknown): value is LintMode {
  return LINT_MODES.includes(value as LintMode)
}

export function normalizeEditorSettings(raw: unknown): EditorSettings {
  const defaults = defaultEditorSettings()
  if (!isRecord(raw)) {
    return defaults
  }

  const disabledLanguages = Array.isArray(raw.disabledLanguages) ? raw.disabledLanguages.filter(isLanguageId) : []
  return {
    disabledLanguages,
    lintMode: isLintMode(raw.lintMode) ? raw.lintMode : defaults.lintMode,
    formatOnSave: typeof raw.formatOnSave === 'boolean' ? raw.formatOnSave : defaults.formatOnSave,
    autoSaveEnabled: typeof raw.autoSaveEnabled === 'boolean' ? raw.autoSaveEnabled : defaults.autoSaveEnabled,
    autoSaveDelayMs:
      typeof raw.autoSaveDelayMs === 'number' ? clampAutoSaveDelay(raw.autoSaveDelayMs) : defaults.autoSaveDelayMs,
    vimMode: typeof raw.vimMode === 'boolean' ? raw.vimMode : defaults.vimMode,
    cursorShape: isCursorShape(raw.cursorShape) ? raw.cursorShape : defaults.cursorShape,
    cursorColor: normalizeHexColor(raw.cursorColor),
    cursorBlinks: typeof raw.cursorBlinks === 'boolean' ? raw.cursorBlinks : defaults.cursorBlinks,
    cursorGlides: typeof raw.cursorGlides === 'boolean' ? raw.cursorGlides : defaults.cursorGlides
  }
}
