import { create } from 'zustand'
import {
  clampAutoSaveDelay,
  defaultEditorSettings,
  normalizeEditorSettings,
  type EditorSettings,
  type LintMode
} from '../features/editor/editorSettings'
import type { LanguageId } from '../features/editor/languageRegistry'

const STORAGE_KEY = 'o-bros.editorSettings'

interface EditorSettingsState extends EditorSettings {
  setLanguageEnabled: (id: LanguageId, isEnabled: boolean) => void
  setLintMode: (mode: LintMode) => void
  setFormatOnSave: (isEnabled: boolean) => void
  setAutoSaveEnabled: (isEnabled: boolean) => void
  setAutoSaveDelay: (delayMs: number) => void
}

function loadSavedSettings(): EditorSettings {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    return saved === null ? defaultEditorSettings() : normalizeEditorSettings(JSON.parse(saved))
  } catch {
    return defaultEditorSettings()
  }
}

function pickSettings(state: EditorSettings): EditorSettings {
  const { disabledLanguages, lintMode, formatOnSave, autoSaveEnabled, autoSaveDelayMs } = state
  return { disabledLanguages, lintMode, formatOnSave, autoSaveEnabled, autoSaveDelayMs }
}

export function isLanguageEnabled(settings: EditorSettings, id: LanguageId): boolean {
  return !settings.disabledLanguages.includes(id)
}

export const useEditorSettingsStore = create<EditorSettingsState>()((set, get) => {
  function change(changes: Partial<EditorSettings>): void {
    set(changes)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(pickSettings(get())))
    } catch {
      return
    }
  }

  return {
    ...loadSavedSettings(),

    setLanguageEnabled: (id, isEnabled) => {
      const others = get().disabledLanguages.filter((disabledId) => disabledId !== id)
      change({ disabledLanguages: isEnabled ? others : [...others, id] })
    },

    setLintMode: (lintMode) => change({ lintMode }),

    setFormatOnSave: (formatOnSave) => change({ formatOnSave }),

    setAutoSaveEnabled: (autoSaveEnabled) => change({ autoSaveEnabled }),

    setAutoSaveDelay: (delayMs) => change({ autoSaveDelayMs: clampAutoSaveDelay(delayMs) })
  }
})
