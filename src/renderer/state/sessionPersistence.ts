import { parseSession, serializeSession, type SessionSnapshot } from '../features/terminal/sessionSnapshot'
import { useWorkspaceStore } from './workspaceStore'

const STORAGE_KEY = 'o-bros.session'
const SAVE_DELAY_MS = 500

export function loadSavedSession(): SessionSnapshot | null {
  try {
    return parseSession(localStorage.getItem(STORAGE_KEY))
  } catch {
    return null
  }
}

export function startSessionPersistence(): () => void {
  let saveTimer: ReturnType<typeof setTimeout> | null = null

  const stopListening = useWorkspaceStore.subscribe((state, previous) => {
    if (state.tabs === previous.tabs && state.activeTabId === previous.activeTabId) {
      return
    }
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
    }
    saveTimer = setTimeout(() => {
      try {
        const { tabs, activeTabId } = useWorkspaceStore.getState()
        localStorage.setItem(STORAGE_KEY, serializeSession({ tabs, activeTabId }))
      } catch {
        return
      }
    }, SAVE_DELAY_MS)
  })

  return () => {
    stopListening()
    if (saveTimer !== null) {
      clearTimeout(saveTimer)
    }
  }
}

export function restoreSavedSession(): void {
  const saved = loadSavedSession()
  if (saved !== null && useWorkspaceStore.getState().tabs.length === 0) {
    useWorkspaceStore.getState().restoreTabs(saved.tabs, saved.activeTabId)
  }
}
