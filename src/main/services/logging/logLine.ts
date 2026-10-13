export type LogLevel = 'error' | 'warning' | 'info'

export const LOG_LEVELS: LogLevel[] = ['error', 'warning', 'info']

const MAX_MESSAGE_LENGTH = 2000

export function formatLogLine(level: LogLevel, message: string, now: Date): string {
  const singleLine = message.split('\n').join(' | ').slice(0, MAX_MESSAGE_LENGTH)
  return `${now.toISOString()} ${level.toUpperCase()} ${singleLine}\n`
}
