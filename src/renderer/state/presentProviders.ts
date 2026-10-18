import type { ProviderId } from '../../shared/types'
import { useAccountsStore } from './accountsStore'
import { useInstalledCommandsStore } from './installedCommandsStore'

export function useIsProviderPresent(): (provider: ProviderId) => boolean {
  const accounts = useAccountsStore((state) => state.accounts)
  const installedCommands = useInstalledCommandsStore((state) => state.commands)
  return (provider) =>
    installedCommands === null ||
    installedCommands.includes(provider) ||
    accounts.some((account) => account.provider === provider)
}
