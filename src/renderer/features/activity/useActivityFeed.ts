import { useEffect } from 'react'
import type { ActivityEntry } from '../../../shared/activity'
import { useActivityStore } from '../../state/activityStore'

export function useActivityFeed(): ActivityEntry[] | null {
  const entries = useActivityStore((state) => state.entries)
  const load = useActivityStore((state) => state.load)
  const add = useActivityStore((state) => state.add)

  useEffect(() => {
    void load()
    return window.api.activity.onAdded(add)
  }, [load, add])

  return entries
}
