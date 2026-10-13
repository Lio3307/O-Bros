import { quotePathForShell } from './shellQuote'
import type { ProviderId } from './types'

export function resumeCommandFor(provider: ProviderId, sessionId: string): string {
  const quotedId = quotePathForShell(sessionId)
  return provider === 'claude' ? `claude --resume ${quotedId}` : `codex resume ${quotedId}`
}
