import { isLanguageEnabled, useEditorSettingsStore } from '../../state/editorSettingsStore'
import { LINT_MODES, type LintMode } from '../editor/editorSettings'
import { LANGUAGES } from '../editor/languageRegistry'
import { AutoSaveSetting } from './AutoSaveSetting'
import './settings.css'
import './settingsControls.css'

const LINT_MODE_LABELS: Record<LintMode, string> = {
  off: 'Off',
  'on-save': 'On save',
  'as-you-type': 'As you type'
}

export function EditorSettingsPage() {
  const settings = useEditorSettingsStore()

  return (
    <div className="settings-page">
      <header className="settings-header">
        <div>
          <h1 className="settings-title">Editor</h1>
          <p className="muted">
            Languages, the Oxc linter and the Oxc formatter. Changes apply to files you open afterwards. Turning a
            language off opens its files as plain text, which uses less memory.
          </p>
        </div>
      </header>

      <AutoSaveSetting />

      <section className="settings-section">
        <h2 className="settings-subtitle">Linter (oxlint)</h2>
        <p className="muted">
          Checks JavaScript and TypeScript. Uses a .oxlintrc.json in your project folder when there is one.
        </p>
        <div className="segmented settings-segmented">
          {LINT_MODES.map((mode) => (
            <button
              key={mode}
              type="button"
              className={mode === settings.lintMode ? 'segment segment-active' : 'segment'}
              onClick={() => settings.setLintMode(mode)}
            >
              {LINT_MODE_LABELS[mode]}
            </button>
          ))}
        </div>
      </section>

      <section className="settings-section">
        <h2 className="settings-subtitle">Formatter (oxfmt)</h2>
        <p className="muted">
          Format a file with Shift+Alt+F. Available for JavaScript, TypeScript, JSON, CSS, HTML, Markdown and YAML.
        </p>
        <label className="toggle-row">
          <input
            type="checkbox"
            checked={settings.formatOnSave}
            onChange={(event) => settings.setFormatOnSave(event.target.checked)}
          />
          <span>Format when saving (Ctrl+S)</span>
        </label>
      </section>

      <section className="settings-section">
        <h2 className="settings-subtitle">Languages</h2>
        <div className="table">
          {LANGUAGES.map((language) => (
            <label key={language.id} className="table-row toggle-row">
              <input
                type="checkbox"
                checked={isLanguageEnabled(settings, language.id)}
                onChange={(event) => settings.setLanguageEnabled(language.id, event.target.checked)}
              />
              <div className="cell cell-account">
                <span className="account-label">{language.label}</span>
                <span className="muted">{language.extensions.map((extension) => `.${extension}`).join('  ')}</span>
              </div>
              <span className="muted">
                {[language.canLint ? 'Lint' : null, language.canFormat ? 'Format' : null].filter(Boolean).join(' · ')}
              </span>
            </label>
          ))}
        </div>
      </section>
    </div>
  )
}
