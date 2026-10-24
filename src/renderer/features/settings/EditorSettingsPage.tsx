import { isLanguageEnabled, useEditorSettingsStore } from '../../state/editorSettingsStore'
import { LINT_MODES, type LintMode } from '../editor/editorSettings'
import { LANGUAGES, OTHER_LANGUAGE_NAMES, type LanguageId } from '../editor/languageRegistry'
import { AutoSaveSetting } from './AutoSaveSetting'
import { ColorThemeSetting } from './ColorThemeSetting'
import './settings.css'
import './settingsControls.css'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { SegmentedControl } from '../../ui/SegmentedControl'

const OTHER_LANGUAGE_EXAMPLES = ['Vue', 'Shell', 'TOML', 'Dockerfile', 'Kotlin', 'Swift', 'Ruby', 'C#'].filter((name) =>
  OTHER_LANGUAGE_NAMES.includes(name)
)
const OTHER_LANGUAGES_DETAIL = `${OTHER_LANGUAGE_EXAMPLES.join(', ')} and ${OTHER_LANGUAGE_NAMES.length - OTHER_LANGUAGE_EXAMPLES.length} more`

interface LanguageRowProps {
  id: LanguageId
  label: string
  detail: string
  tools: string
}

function LanguageRow({ id, label, detail, tools }: LanguageRowProps) {
  const isEnabled = useEditorSettingsStore((state) => isLanguageEnabled(state, id))
  const setLanguageEnabled = useEditorSettingsStore((state) => state.setLanguageEnabled)
  return (
    <label className="table-row toggle-row">
      <input type="checkbox" role="switch" checked={isEnabled} onChange={(event) => setLanguageEnabled(id, event.target.checked)} />
      <div className="cell cell-account">
        <span className="account-label">{label}</span>
        <span className="muted">{detail}</span>
      </div>
      <span className="muted">{tools}</span>
    </label>
  )
}

const LINT_MODE_LABELS: Record<LintMode, string> = {
  off: 'Off',
  'on-save': 'On save',
  'as-you-type': 'As you type'
}

export function EditorSettingsPage() {
  const settings = useEditorSettingsStore()

  return (
    <SettingsPageLayout
      title="Editor"
      description={
        <>
          Languages, the Oxc linter and the Oxc formatter. Changes apply to files you open afterwards. Turning a
          language off opens its files as plain text, which uses less memory.
        </>
      }
    >
      <ColorThemeSetting />

      <AutoSaveSetting />

      <SettingsSection
        title="Linter (oxlint)"
        description="Checks JavaScript and TypeScript. Uses a .oxlintrc.json in your project folder when there is one."
      >
        <SegmentedControl
          className="settings-segmented"
          options={LINT_MODES.map((mode) => ({ value: mode, label: LINT_MODE_LABELS[mode] }))}
          value={settings.lintMode}
          onChange={settings.setLintMode}
        />
      </SettingsSection>

      <SettingsSection
        title="Formatter (oxfmt)"
        description="Format a file with Shift+Alt+F. Available for JavaScript, TypeScript, JSON, CSS, HTML, Markdown and YAML."
      >
        <label className="toggle-row">
          <input
            type="checkbox" role="switch"
            checked={settings.formatOnSave}
            onChange={(event) => settings.setFormatOnSave(event.target.checked)}
          />
          <span>Format when saving (Ctrl+S)</span>
        </label>
      </SettingsSection>

      <SettingsSection
        title="Languages"
        description="Colors come with O-BROS and load only when you open a matching file. A file is recognized by its name, or by its first line when the name says nothing."
      >
        <div className="table">
          {LANGUAGES.map((language) => (
            <LanguageRow
              key={language.id}
              id={language.id}
              label={language.label}
              detail={language.extensions.map((extension) => `.${extension}`).join('  ')}
              tools={[language.canLint ? 'Lint' : null, language.canFormat ? 'Format' : null].filter(Boolean).join(' · ')}
            />
          ))}
          <LanguageRow id="other" label="Every other language" detail={OTHER_LANGUAGES_DETAIL} tools="" />
        </div>
      </SettingsSection>
    </SettingsPageLayout>
  )
}
