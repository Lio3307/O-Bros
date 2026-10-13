import { ipcMain } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import type { AccountRef, ProviderId } from '../../shared/types'
import { createAccountFolder, scanAccounts } from '../services/accountScanner'
import { readUsage } from '../services/usageReader'

export function registerAccountsIpc(): void {
  ipcMain.handle(IpcChannel.accountsScan, () => scanAccounts())
  ipcMain.handle(IpcChannel.accountsCreateFolder, (_event, provider: ProviderId, accountName: string) =>
    createAccountFolder(provider, accountName)
  )
  ipcMain.handle(IpcChannel.usageGet, (_event, account: AccountRef) => readUsage(account))
}
