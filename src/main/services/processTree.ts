import { execFile, spawnSync, type ChildProcess } from 'node:child_process'

const END_TREE_NOW_TIMEOUT_MS = 2000

export function endProcessTreeNow(pid: number): void {
  if (process.platform === 'win32') {
    spawnSync('taskkill', ['/pid', String(pid), '/T', '/F'], { windowsHide: true, timeout: END_TREE_NOW_TIMEOUT_MS, stdio: 'ignore' })
  }
}

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
