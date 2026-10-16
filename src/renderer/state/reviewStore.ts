import { create } from 'zustand'
import { friendlyErrorMessage } from '../../shared/friendlyError'
import type { ReviewBaseline, ReviewChange } from '../../shared/types'
import { toast } from './toastStore'

interface ReviewState {
  baselines: Record<string, ReviewBaseline>
  changesByTab: Record<string, ReviewChange[]>
  isLoadingTabIds: string[]
  capture: (tabId: string, cwd: string) => Promise<void>
  refresh: (tabId: string) => Promise<void>
  revert: (tabId: string, change: ReviewChange) => Promise<boolean>
  forget: (tabId: string) => void
}

const LOAD_FAILED_MESSAGE = 'Could not read what the agent changed.'
const REVERT_FAILED_MESSAGE = 'Could not put this file back.'

function withoutKey<Value>(record: Record<string, Value>, key: string): Record<string, Value> {
  const { [key]: removed, ...rest } = record
  return removed === undefined ? record : rest
}

export const useReviewStore = create<ReviewState>()((set, get) => ({
  baselines: {},
  changesByTab: {},
  isLoadingTabIds: [],

  capture: async (tabId, cwd) => {
    try {
      const baseline = await window.api.git.reviewBaseline(cwd)
      if (baseline !== null) {
        set((state) => ({ baselines: { ...state.baselines, [tabId]: baseline } }))
      }
    } catch {
      return
    }
  },

  refresh: async (tabId) => {
    const baseline = get().baselines[tabId]
    if (baseline === undefined) {
      return
    }
    set((state) => ({ isLoadingTabIds: [...state.isLoadingTabIds, tabId] }))
    try {
      const changes = await window.api.git.reviewChanges(baseline)
      set((state) => ({ changesByTab: { ...state.changesByTab, [tabId]: changes } }))
    } catch (error) {
      toast.error(friendlyErrorMessage(error, LOAD_FAILED_MESSAGE))
    } finally {
      set((state) => ({ isLoadingTabIds: state.isLoadingTabIds.filter((id) => id !== tabId) }))
    }
  },

  revert: async (tabId, change) => {
    const baseline = get().baselines[tabId]
    if (baseline === undefined) {
      return false
    }
    try {
      await window.api.git.reviewRevert({ baseline, change })
      await get().refresh(tabId)
      return true
    } catch (error) {
      toast.error(friendlyErrorMessage(error, REVERT_FAILED_MESSAGE))
      return false
    }
  },

  forget: (tabId) =>
    set((state) => ({
      baselines: withoutKey(state.baselines, tabId),
      changesByTab: withoutKey(state.changesByTab, tabId)
    }))
}))
