import { useEffect } from 'react'
import { findShortcutAction } from '../../../shared/shortcuts'
import { useShortcutsStore } from '../../state/shortcutsStore'
import { REPEATING_ACTIONS, SHORTCUT_ACTIONS } from './shortcutActions'

export function useWorkspaceShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const { shortcuts, isRecording } = useShortcutsStore.getState()
      if (isRecording) {
        return
      }
      const action = findShortcutAction(shortcuts, event)
      if (action === null) {
        return
      }
      const runs = !event.repeat || REPEATING_ACTIONS.includes(action)
      if (runs && SHORTCUT_ACTIONS[action]() === false) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])
}
