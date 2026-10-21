import { useEffect } from 'react'
import { findShortcutAction } from '../../../shared/shortcuts'
import { useShortcutsStore } from '../../state/shortcutsStore'
import { SHORTCUT_ACTIONS } from './shortcutActions'

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
      event.preventDefault()
      event.stopPropagation()
      if (event.repeat) {
        return
      }
      SHORTCUT_ACTIONS[action]()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])
}
