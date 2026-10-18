import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { AccountRef, ProviderId } from '../../shared/types'
import { createAccountFolder, scanAccounts } from '../services/accountScanner'
import { readAgentLogins } from '../services/agentLogins'
import { providerKeyHints, saveProviderKey } from '../services/customProviders/providerKeys'
import { testCustomProvider } from '../services/customProviders/providerTest'
import { readUsage } from '../services/usageReader'
import { readCreditBalances } from '../services/usage/creditBalances'
import { readUsageFacts } from '../services/usage/usageFacts'

export function registerAccountsIpc(): void {
  ipcMain.handle(IpcChannel.accountsScan, () => scanAccounts())
  ipcMain.handle(IpcChannel.accountsCreateFolder, (_event, provider: ProviderId, accountName: string) =>
    createAccountFolder(provider, accountName)
  )
  ipcMain.handle(IpcChannel.usageGet, (_event, account: AccountRef) => readUsage(account))
  ipcMain.handle(IpcChannel.usageCredits, () => readCreditBalances())
  ipcMain.handle(IpcChannel.usageFacts, () => readUsageFacts())
  ipcMain.handle(IpcChannel.accountsAgentLogins, () => readAgentLogins())
  ipcMain.handle(IpcChannel.accountsProviderKeyHints, () => providerKeyHints())
  ipcMain.handle(IpcChannel.accountsTestProvider, (_event, provider: unknown) => testCustomProvider(provider))
  ipcMain.handle(IpcChannel.accountsSaveProviderKey, (_event, providerId: string, apiKey: string | null) =>
    saveProviderKey(String(providerId), typeof apiKey === 'string' ? apiKey : null)
  )
}
