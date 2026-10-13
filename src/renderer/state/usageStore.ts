import { create } from 'zustand'
import type { AccountUsage, DetectedAccount } from '../../shared/types'

interface UsageState {
  usageByAccountId: Record<string, AccountUsage>
  refresh: (accounts: DetectedAccount[]) => Promise<void>
}

export const useUsageStore = create<UsageState>()((set) => ({
  usageByAccountId: {},

  refresh: async (accounts) => {
    const entries = await Promise.all(
      accounts.map(async (account) => {
        const usage = await window.api.usage.get({ provider: account.provider, configDir: account.configDir })
        return [account.id, usage] as const
      })
    )
    set({ usageByAccountId: Object.fromEntries(entries) })
  }
}))
