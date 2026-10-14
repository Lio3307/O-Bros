import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { useState } from 'react'
import { useEditorSettingsStore } from '../../state/editorSettingsStore'
import { LANGUAGES, type LanguageId } from '../editor/languageRegistry'
import './settings.css'
import './settingsControls.css'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SegmentedControl } from '../../ui/SegmentedControl'

const JUMP_PLACE_EXAMPLE = '${1}'
const NAMED_PLACE_EXAMPLE = '${2:name}'
const LINE_BREAK = '\n'
const MIN_BODY_ROWS = 2

export function SnippetsPage() {
  const [languageId, setLanguageId] = useState<LanguageId>('typescript')
  const snippets = useEditorSettingsStore((state) => state.snippets[languageId])
  const addSnippet = useEditorSettingsStore((state) => state.addSnippet)
  const updateSnippet = useEditorSettingsStore((state) => state.updateSnippet)
  const removeSnippet = useEditorSettingsStore((state) => state.removeSnippet)
  const resetSnippets = useEditorSettingsStore((state) => state.resetSnippets)

  return (
    <SettingsPageLayout
      title="Snippets"
      description={
        <>
          Type a prefix in the editor and pick it from the suggestions. In a body, use {JUMP_PLACE_EXAMPLE} or{' '}
          {NAMED_PLACE_EXAMPLE} for places to jump to with Tab.
        </>
      }
      actions={
        <>
          <Button variant="outline" onClick={() => resetSnippets(languageId)}>
            <RotateCcw size={14} /> Reset
          </Button>
          <Button variant="outline" onClick={() => addSnippet(languageId)}>
            <Plus size={14} /> Add snippet
          </Button>
        </>
      }
    >
      <SegmentedControl
        className="settings-segmented settings-wrap"
        options={LANGUAGES.map((language) => ({ value: language.id, label: language.label }))}
        value={languageId}
        onChange={setLanguageId}
      />

      <div className="table">
        {snippets.length === 0 && <p className="panel-empty">No snippets for this language yet.</p>}
        {snippets.map((snippet, index) => (
          <div key={index} className="table-row snippet-row">
            <div className="snippet-fields">
              <div className="snippet-line">
                <input
                  className="field field-prefix"
                  placeholder="Prefix"
                  value={snippet.prefix}
                  onChange={(event) => updateSnippet(languageId, index, { prefix: event.target.value })}
                />
                <input
                  className="field"
                  placeholder="Description"
                  value={snippet.description}
                  onChange={(event) => updateSnippet(languageId, index, { description: event.target.value })}
                />
              </div>
              <textarea
                className="field field-body"
                placeholder="Body"
                rows={Math.max(MIN_BODY_ROWS, snippet.body.split(LINE_BREAK).length)}
                spellCheck={false}
                value={snippet.body}
                onChange={(event) => updateSnippet(languageId, index, { body: event.target.value })}
              />
            </div>
            <Button
              variant="remove"
              title="Remove snippet"
              onClick={() => removeSnippet(languageId, index)}
            >
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </SettingsPageLayout>
  )
}
