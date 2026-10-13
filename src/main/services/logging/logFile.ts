import { app } from 'electron'
import { appendFile, mkdir, rename, stat } from 'node:fs/promises'
import { join } from 'node:path'
import { formatLogLine, type LogLevel } from './logLine'

const MAX_LOG_BYTES = 1_000_000

let pendingWrite: Promise<void> = Promise.resolve()

export function logDirectory(): string {
  return app.getPath('logs')
}

async function rotateWhenLarge(logPath: string): Promise<void> {
  try {
    if ((await stat(logPath)).size > MAX_LOG_BYTES) {
      await rename(logPath, join(logDirectory(), 'o-bros.previous.log'))
    }
  } catch {
    return
  }
}

async function appendLine(line: string): Promise<void> {
  try {
    await mkdir(logDirectory(), { recursive: true })
    const logPath = join(logDirectory(), 'o-bros.log')
    await rotateWhenLarge(logPath)
    await appendFile(logPath, line, 'utf8')
  } catch {
    return
  }
}

export function writeLog(level: LogLevel, message: string): void {
  const line = formatLogLine(level, message, new Date())
  pendingWrite = pendingWrite.then(() => appendLine(line))
}
