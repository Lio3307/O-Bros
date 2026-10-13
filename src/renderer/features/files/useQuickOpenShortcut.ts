import { useEffect } from 'react'
import { useLayoutStore } from '../../state/layoutStore'

export function useQuickOpenShortcut(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      const isShortcut = (event.ctrlKey || event.metaKey) && !event.shiftKey && event.key.toLowerCase() === 'p'
      if (!isShortcut) {
        return
      }
      event.preventDefault()
      event.stopPropagation()
      const { isQuickOpenVisible, openQuickOpen, closeQuickOpen } = useLayoutStore.getState()
      if (isQuickOpenVisible) {
        closeQuickOpen()
      } else {
        openQuickOpen()
      }
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])
}
