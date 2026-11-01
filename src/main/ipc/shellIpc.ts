import { ipcMain, shell } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { assertInsideProjectRoots } from '../pathGuard'
import { gitRisksOf, isFolderTrusted, listTrustedFolders, stopTrustingFolder, trustFolder } from '../services/folderTrust'
import { projectServerNamesIn } from '../services/languageServers/languageServerCatalog'

export function registerShellIpc(): void {
  ipcMain.handle(IpcChannel.shellReveal, async (_event, path: string) => {
    await assertInsideProjectRoots(path)
    shell.showItemInFolder(path)
  })
  ipcMain.handle(IpcChannel.trustCheck, async (_event, folder: string) => {
    await assertInsideProjectRoots(folder)
    const [gitRisks, servers, isTrusted] = await Promise.all([gitRisksOf(folder), projectServerNamesIn(folder), isFolderTrusted(folder)])
    return { isTrusted, risks: [...gitRisks, ...servers.map((name) => `Its own language server: ${name}`)] }
  })
  ipcMain.handle(IpcChannel.trustGrant, async (_event, folder: string) => {
    await assertInsideProjectRoots(folder)
    await trustFolder(folder)
  })
  ipcMain.handle(IpcChannel.trustList, () => listTrustedFolders())
  ipcMain.handle(IpcChannel.trustRevoke, (_event, folder: string) => stopTrustingFolder(folder))
}
