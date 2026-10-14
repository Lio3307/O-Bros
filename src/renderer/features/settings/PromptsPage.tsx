import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { usePromptsStore } from '../../state/promptsStore'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import '../prompts/prompts.css'
import './settings.css'
import './settingsControls.css'

export function PromptsPage() {
  const prompts = usePromptsStore((state) => state.prompts)
  const add = usePromptsStore((state) => state.add)
  const update = usePromptsStore((state) => state.update)
  const remove = usePromptsStore((state) => state.remove)
  const reset = usePromptsStore((state) => state.reset)

  return (
    <SettingsPageLayout
      title="Prompts"
      description="Texts you send often to Claude, Codex or any agent. Press the Prompts button in the tab bar, or its shortcut, pick one and it is inserted into the focused terminal."
      actions={
        <>
          <Button variant="outline" onClick={reset}>
            <RotateCcw size={14} /> Reset to examples
          </Button>
          <Button variant="outline" onClick={add}>
            <Plus size={14} /> Add prompt
          </Button>
        </>
      }
    >
      <div className="table">
        {prompts.length === 0 && <p className="panel-empty">No prompts yet. Add one.</p>}
        {prompts.map((prompt) => (
          <div key={prompt.id} className="table-row">
            <div className="prompt-fields">
              <input
                className="field"
                placeholder="Title"
                value={prompt.title}
                onChange={(event) => update(prompt.id, { title: event.target.value })}
              />
              <textarea
                className="field prompt-text"
                placeholder="The text to send to the terminal"
                value={prompt.text}
                onChange={(event) => update(prompt.id, { text: event.target.value })}
              />
            </div>
            <Button variant="remove" title="Remove" onClick={() => remove(prompt.id)}>
              <Trash2 size={14} />
            </Button>
          </div>
        ))}
      </div>
    </SettingsPageLayout>
  )
}
