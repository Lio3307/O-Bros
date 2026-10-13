import { useEffect } from 'react'
import { useTerminalFontStore } from '../../state/terminalFontStore'

const ZOOM_IN_KEYS = ['=', '+']
const ZOOM_OUT_KEYS = ['-', '_']
const ZOOM_RESET_KEY = '0'

export function useTerminalZoomShortcuts(): void {
  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent): void {
      if (!(event.ctrlKey || event.metaKey)) {
        return
      }
      const { increase, decrease, reset } = useTerminalFontStore.getState()

      if (ZOOM_IN_KEYS.includes(event.key)) {
        increase()
      } else if (ZOOM_OUT_KEYS.includes(event.key)) {
        decrease()
      } else if (event.key === ZOOM_RESET_KEY) {
        reset()
      } else {
        return
      }
      event.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown, true)
    return () => window.removeEventListener('keydown', handleKeyDown, true)
  }, [])
}
