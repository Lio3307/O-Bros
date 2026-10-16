import { create } from 'zustand'
import type { CreditBalance } from '../../shared/creditBalance'
import type { DetectedAccount } from '../../shared/types'
import type { UsageFacts } from '../../shared/usageSupport'
import { mergeUsage, type KnownUsage } from '../../shared/usageMerge'

interface UsageState {
  usageByAccountId: Record<string, KnownUsage>
  credits: CreditBalance[]
  facts: UsageFacts | null
  refresh: (accounts: DetectedAccount[]) => Promise<void>
}

export const useUsageStore = create<UsageState>()((set, get) => ({
  usageByAccountId: {},
  credits: [],
  facts: null,

  refresh: async (accounts) => {
    const now = Date.now()
    const [entries, credits, facts] = await Promise.all([
      Promise.all(
        accounts.map(async (account) => {
          const usage = await window.api.usage.get({ provider: account.provider, configDir: account.configDir })
          return [account.id, mergeUsage(get().usageByAccountId[account.id], usage, now)] as const
        })
      ),
      window.api.usage.credits().catch(() => get().credits),
      window.api.usage.facts().catch(() => get().facts)
    ])
    set({ usageByAccountId: Object.fromEntries(entries), credits, facts })
  }
}))
