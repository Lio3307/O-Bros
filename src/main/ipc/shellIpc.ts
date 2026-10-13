import { ipcMain, shell } from 'electron'
import { IpcChannel } from '../../shared/ipc'
import { assertInsideProjectRoots } from '../pathGuard'

export function registerShellIpc(): void {
  ipcMain.handle(IpcChannel.shellReveal, async (_event, path: string) => {
    await assertInsideProjectRoots(path)
    shell.showItemInFolder(path)
  })
}
