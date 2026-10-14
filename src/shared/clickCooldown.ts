export function createClickCooldown(cooldownMs: number, now: () => number = Date.now): () => boolean {
  let lastAllowedAt = Number.NEGATIVE_INFINITY

  return () => {
    const currentTime = now()
    if (currentTime - lastAllowedAt < cooldownMs) {
      return false
    }
    lastAllowedAt = currentTime
    return true
  }
}
