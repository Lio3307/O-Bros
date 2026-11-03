import { create } from 'zustand'
import type { ProviderId } from '../../shared/types'

export type HandoffStep = 'reading' | 'opening' | 'sending' | 'done'

export interface Handoff {
  fromProvider: ProviderId
  toName: string
  toCommand: string
  step: HandoffStep
  note: string
}

export const useHandoffStore = create<{ handoff: Handoff | null }>()(() => ({ handoff: null }))
