import { useCallback, useState } from 'react'
import type { LiveAgent } from '../../../../shared/activity'
import { useResourcesStore } from '../../../state/resourcesStore'
import { useLiveRefresh } from '../../../ui/useLiveRefresh'

const LIVE_POLL_MS = 2000
const RESOURCES_POLL_MS = 10_000

export function useLiveAgents(): LiveAgent[] | null {
  const [agents, setAgents] = useState<LiveAgent[] | null>(null)
  const pollResources = useResourcesStore((state) => state.poll)

  const readLive = useCallback(async () => {
    setAgents(await window.api.activity.live().catch(() => []))
  }, [])
  useLiveRefresh(readLive, LIVE_POLL_MS, { refreshNow: true })
  useLiveRefresh(pollResources, RESOURCES_POLL_MS, { refreshNow: true })

  return agents
}
