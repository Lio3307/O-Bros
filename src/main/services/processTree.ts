import { execFile, type ChildProcess } from 'node:child_process'

export function killProcessTree(child: ChildProcess): void {
  if (child.pid === undefined || child.exitCode !== null) {
    return
  }
  if (process.platform === 'win32') {
    execFile('taskkill', ['/pid', String(child.pid), '/T', '/F'], { windowsHide: true }, () => undefined)
    return
  }
  child.kill()
}
