import { Plus, RotateCcw, Trash2 } from 'lucide-react'
import { askToConfirm } from '../../state/confirmStore'
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

  async function confirmReset(): Promise<void> {
    const isConfirmed = await askToConfirm({
      title: 'Reset to examples?',
      message: 'Your prompts are replaced by the example prompts. Prompts you wrote or changed are lost.',
      confirmLabel: 'Reset'
    })
    if (isConfirmed) {
      reset()
    }
  }

  return (
    <SettingsPageLayout
      title="Prompts"
      description="Texts you send often to any agent. Press the Prompts button in the tab bar, or its shortcut, pick one and it is inserted into the focused terminal."
      actions={
        <>
          <Button variant="outline" onClick={confirmReset}>
            <RotateCcw size={14} /> Reset to examples
          </Button>
          <Button variant="outline" onClick={add}>
            <Plus size={14} /> Add prompt
          </Button>
        </>
      }
    >
      <div className="table">
        {prompts.length === 0 && <p className="panel-empty">No prompts yet. Press Add prompt to write one.</p>}
        {prompts.map((prompt) => (
          <div key={prompt.id} className="table-row table-row-stacked">
            <div className="prompt-fields">
              <div className="prompt-header">
                <input
                  className="field prompt-title"
                  placeholder="Title"
                  aria-label="Prompt title"
                  value={prompt.title}
                  onChange={(event) => update(prompt.id, { title: event.target.value })}
                />
                <Button variant="remove" className="hover-danger" title="Remove this prompt" onClick={() => remove(prompt.id)}>
                  <Trash2 size={14} />
                </Button>
              </div>
              <textarea
                className="field prompt-text"
                placeholder="The text to send to the terminal"
                aria-label="Prompt text"
                rows={3}
                value={prompt.text}
                onChange={(event) => update(prompt.id, { text: event.target.value })}
              />
            </div>
          </div>
        ))}
      </div>
    </SettingsPageLayout>
  )
}
