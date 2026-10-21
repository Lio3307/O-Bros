export function commandWithSessionId(command: string, sessionId: string | null): string {
  return sessionId === null ? command : `${command} --session-id ${sessionId}`
}
