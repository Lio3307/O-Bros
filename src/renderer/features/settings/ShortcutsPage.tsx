import { RotateCcw } from 'lucide-react'
import { useEffect, useState } from 'react'
import {
  findShortcutProblem,
  formatShortcut,
  SHORTCUT_ACTIONS,
  SHORTCUT_LABELS,
  shortcutFromEvent,
  type ShortcutAction,
  type ShortcutProblem
} from '../../../shared/shortcuts'
import { isMacPlatform, useShortcutsStore } from '../../state/shortcutsStore'
import { Button } from '../../ui/Button'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import './settings.css'
import './settingsControls.css'

function problemText(problem: ShortcutProblem): string {
  if (problem === 'needs-modifier') {
    return 'Use Ctrl, Cmd or Alt together with a key, so typing in a terminal is not affected.'
  }
  if (problem === 'reserved') {
    return 'That shortcut is already used for copy, paste, save, search or quick open.'
  }
  return `That shortcut is already used for "${SHORTCUT_LABELS[problem.usedBy].title}".`
}

function ShortcutRow({ action }: { action: ShortcutAction }) {
  const shortcuts = useShortcutsStore((state) => state.shortcuts)
  const setShortcut = useShortcutsStore((state) => state.setShortcut)
  const resetShortcut = useShortcutsStore((state) => state.resetShortcut)
  const setRecording = useShortcutsStore((state) => state.setRecording)
  const [isCapturing, setIsCapturing] = useState(false)
  const [problem, setProblem] = useState<ShortcutProblem | null>(null)

  useEffect(() => {
    if (!isCapturing) {
      return
    }
    setRecording(true)

    function capture(event: KeyboardEvent): void {
      event.preventDefault()
      event.stopPropagation()
      if (event.key === 'Escape') {
        setIsCapturing(false)
        return
      }
      const pressed = shortcutFromEvent(event)
      if (pressed === null) {
        return
      }
      const found = findShortcutProblem(shortcuts, action, pressed)
      setProblem(found)
      if (found === null) {
        setShortcut(action, pressed)
        setIsCapturing(false)
      }
    }

    window.addEventListener('keydown', capture, true)
    return () => {
      window.removeEventListener('keydown', capture, true)
      setRecording(false)
    }
  }, [isCapturing, action, shortcuts, setShortcut, setRecording])

  const label = SHORTCUT_LABELS[action]
  const current = formatShortcut(shortcuts[action], isMacPlatform())

  return (
    <div className="table-row">
      <div className="cell cell-account">
        <span className="account-label">{label.title}</span>
        <span className="muted">{problem !== null ? problemText(problem) : label.description}</span>
      </div>
      <Button
        variant="outline"
        className="shortcut-key"
        onClick={() => {
          setProblem(null)
          setIsCapturing(!isCapturing)
        }}
      >
        {isCapturing ? 'Press the keys… (Esc cancels)' : current}
      </Button>
      <Button variant="icon" title="Back to the default" onClick={() => resetShortcut(action)}>
        <RotateCcw size={14} />
      </Button>
    </div>
  )
}

export function ShortcutsPage() {
  const resetAll = useShortcutsStore((state) => state.resetAll)

  return (
    <SettingsPageLayout
      title="Shortcuts"
      description="Click a shortcut, then press the keys you want. Shortcuts need Ctrl, Cmd or Alt, so normal typing in a terminal is never taken over."
      actions={
        <Button variant="outline" onClick={resetAll}>
          <RotateCcw size={14} /> Reset all
        </Button>
      }
    >
      <div className="table">
        {SHORTCUT_ACTIONS.map((action) => (
          <ShortcutRow key={action} action={action} />
        ))}
      </div>
    </SettingsPageLayout>
  )
}
