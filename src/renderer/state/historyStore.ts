import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import { FIRST_LISTED_SESSIONS, type SessionSearchHit, type SessionSummary, type ThreadSummary } from '../../shared/types'
import { LIST_BATCH_SIZE } from '../ui/useListBatch'
import { summarizeRemoval } from '../../shared/sessionRemovalResult'
import { toast } from './toastStore'

interface HistoryState {
  sessions: SessionSummary[]
  totalSessions: number
  listedLimit: number
  hasLoaded: boolean
  threads: ThreadSummary[]
  selectedFilePath: string | null
  deletePermanently: boolean
  searchHits: SessionSearchHit[] | null
  isSearching: boolean
  search: (query: string) => Promise<void>
  clearSearch: () => void
  setDeletePermanently: (deletePermanently: boolean) => void
  load: () => Promise<void>
  showMore: () => Promise<void>
  loadThreads: () => Promise<void>
  select: (filePath: string) => void
  remove: (filePaths: string[]) => Promise<void>
}

let latestSearchId = 0
let latestListId = 0

export const useHistoryStore = create<HistoryState>()((set, get) => {
  async function reload(): Promise<void> {
    const listId = ++latestListId
    const [{ sessions, total }, threads] = await Promise.all([
      window.api.history.list(get().listedLimit).finally(() => set({ hasLoaded: true })),
      window.api.history.threads().catch(() => [])
    ])
    if (listId !== latestListId) {
      return
    }
    const selectedStillListed = sessions.some((session) => session.filePath === get().selectedFilePath)
    set({
      sessions,
      totalSessions: total,
      threads,
      selectedFilePath: selectedStillListed ? get().selectedFilePath : (sessions[0]?.filePath ?? null)
    })
  }

  return {
    sessions: [],
    totalSessions: 0,
    listedLimit: FIRST_LISTED_SESSIONS,
    hasLoaded: false,
    threads: [],
    selectedFilePath: null,
    deletePermanently: false,
    searchHits: null,
    isSearching: false,

    loadThreads: async () => {
      set({ threads: await window.api.history.threads().catch(() => get().threads) })
    },

    search: async (query) => {
      latestSearchId += 1
      const searchId = latestSearchId
      if (query.trim() === '') {
        set({ searchHits: null, isSearching: false })
        return
      }
      set({ isSearching: true })
      try {
        const searchHits = await window.api.history.search(query)
        if (searchId === latestSearchId) {
          set({ searchHits, isSearching: false })
        }
      } catch (error) {
        if (searchId === latestSearchId) {
          set({ searchHits: [], isSearching: false })
          toast.error(friendlyErrorMessage(error, 'Could not search your sessions.'))
        }
      }
    },

    clearSearch: () => {
      latestSearchId += 1
      set({ searchHits: null, isSearching: false })
    },

    setDeletePermanently: (deletePermanently) => set({ deletePermanently }),

    load: () => {
      set({ listedLimit: FIRST_LISTED_SESSIONS })
      return reload()
    },

    showMore: async () => {
      set({ listedLimit: get().listedLimit + LIST_BATCH_SIZE })
      await reload()
    },

    select: (selectedFilePath) => set({ selectedFilePath }),

    remove: async (filePaths) => {
      try {
        const permanently = get().deletePermanently
        const summary = summarizeRemoval(await window.api.history.remove(filePaths, permanently), permanently)
        toast[summary.kind](summary.message)
      } catch (error) {
        toast.error(friendlyErrorMessage(error, 'Could not delete the session.'))
      }
      await reload()
      const activeHits = get().searchHits
      if (activeHits !== null) {
        set({ searchHits: activeHits.filter((hit) => !filePaths.includes(hit.filePath)) })
      }
    }
  }
})
