import { session } from 'electron'

export function readAppCacheBytes(): Promise<number> {
  return session.defaultSession.getCacheSize()
}

export async function clearAppCache(): Promise<void> {
  await session.defaultSession.clearCache()
  await session.defaultSession.clearCodeCaches({})
}
