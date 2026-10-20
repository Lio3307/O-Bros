import { parseSession, serializeSession, type SessionSnapshot } from '../features/terminal/sessionSnapshot'
import { useWorkspaceStore } from './workspaceStore'
import { readStored, writeStored } from './browserStorage'

const STORAGE_KEY = 'o-bros.session'
const SAVE_DELAY_MS = 500

export function loadSavedSession(): SessionSnapshot | null {
  return parseSession(readStored(STORAGE_KEY))
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
      const { tabs, activeTabId } = useWorkspaceStore.getState()
      writeStored(STORAGE_KEY, serializeSession({ tabs, activeTabId }))
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
