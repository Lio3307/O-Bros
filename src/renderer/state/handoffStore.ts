import { create } from 'zustand'
import type { ProviderId } from '../../shared/types'

export type HandoffStep = 'reading' | 'opening' | 'sending' | 'done'

export interface Handoff {
  fromProvider: ProviderId
  toName: string
  toCommand: string
  step: HandoffStep
  paneId: string | null
  note: string
}

export const useHandoffStore = create<{ handoff: Handoff | null }>()(() => ({ handoff: null }))

export function handoffInto(handoff: Handoff | null, paneId: string): Handoff | null {
  return handoff !== null && handoff.paneId === paneId && handoff.step !== 'done' ? handoff : null
}

export function isReceivingHandoff(paneId: string): boolean {
  return handoffInto(useHandoffStore.getState().handoff, paneId) !== null
}
