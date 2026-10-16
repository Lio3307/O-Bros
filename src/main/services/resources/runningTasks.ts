import type { RunningTask } from '../../../shared/types'
import { killAllTerminals, listRunningTerminals } from '../ptyManager'
import { describeBackgroundCommands, listBackgroundProcesses } from './backgroundProcesses'
import { collectProcessTree, readProcessTable } from './processTable'

export async function readRunningTasks(): Promise<RunningTask[]> {
  const terminals = listRunningTerminals()
  if (terminals.length === 0) {
    return []
  }

  const table = await readProcessTable()
  const tasks: RunningTask[] = []
  for (const { id, pid } of terminals) {
    const background = listBackgroundProcesses(collectProcessTree(table, pid), pid)
    if (background.length > 0) {
      tasks.push({ paneId: id, commands: describeBackgroundCommands(background) })
    }
  }
  return tasks
}

function stopProcess(pid: number): void {
  try {
    process.kill(pid)
  } catch {
    return
  }
}

async function stopBackgroundProcesses(terminals: { pid: number }[]): Promise<void> {
  if (terminals.length === 0) {
    return
  }
  const table = await readProcessTable()
  for (const { pid } of terminals) {
    listBackgroundProcesses(collectProcessTree(table, pid), pid).forEach((entry) => stopProcess(entry.pid))
  }
}

export async function stopAllRunningTasks(): Promise<void> {
  await stopBackgroundProcesses(listRunningTerminals()).catch(() => undefined)
  killAllTerminals()
}
