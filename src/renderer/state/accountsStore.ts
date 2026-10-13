import { create } from 'zustand'
import type { DetectedAccount, ProviderId } from '../../shared/types'

interface AccountsState {
  accounts: DetectedAccount[]
  activeAccountIdByProvider: Partial<Record<ProviderId, string>>
  rescan: () => Promise<void>
  selectAccount: (provider: ProviderId, accountId: string) => void
}

export const useAccountsStore = create<AccountsState>()((set) => ({
  accounts: [],
  activeAccountIdByProvider: {},

  rescan: async () => {
    const accounts = await window.api.accounts.scan()
    set({ accounts })
  },

  selectAccount: (provider, accountId) => {
    set((state) => ({
      activeAccountIdByProvider: { ...state.activeAccountIdByProvider, [provider]: accountId }
    }))
  }
}))

export function selectActiveAccount(state: AccountsState, provider: ProviderId): DetectedAccount | null {
  const providerAccounts = state.accounts.filter((account) => account.provider === provider)
  const activeId = state.activeAccountIdByProvider[provider]
  return (
    providerAccounts.find((account) => account.id === activeId) ??
    providerAccounts.find((account) => account.isSystemDefault) ??
    providerAccounts[0] ??
    null
  )
}
