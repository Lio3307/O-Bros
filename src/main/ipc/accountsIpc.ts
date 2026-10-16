import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { AccountRef, ProviderId } from '../../shared/types'
import { createAccountFolder, scanAccounts } from '../services/accountScanner'
import { readAgentLogins } from '../services/agentLogins'
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
}
