const OTHER_BELOW_SHARE = 0.02
const CONVERSATIONS_SUFFIX = ' conversations'

export interface StorageItem {
  label: string
  path: string
  bytes: number
}

export interface StorageBlock {
  key: string
  label: string
  bytes: number
  share: number
  path: string | null
  title: string
}

export function agentNameOf(title: string): string {
  return title.split(CONVERSATIONS_SUFFIX).join('')
}

export function storageBlocks(items: StorageItem[], formatSize: (bytes: number) => string): StorageBlock[] {
  const total = items.reduce((sum, item) => sum + item.bytes, 0)
  if (total === 0) {
    return []
  }
  const sorted = items.filter((item) => item.bytes > 0).sort((first, second) => second.bytes - first.bytes)
  const large = sorted.filter((item) => item.bytes / total >= OTHER_BELOW_SHARE)
  const small = sorted.filter((item) => item.bytes / total < OTHER_BELOW_SHARE)
  const blocks = large.map((item) => ({
    key: item.path,
    label: agentNameOf(item.label),
    bytes: item.bytes,
    share: item.bytes / total,
    path: item.path,
    title: `${item.label}: ${formatSize(item.bytes)}`
  }))
  if (small.length === 0) {
    return blocks
  }
  const smallBytes = small.reduce((sum, item) => sum + item.bytes, 0)
  const title = small.map((item) => `${item.label}: ${formatSize(item.bytes)}`).join('\n')
  return [...blocks, { key: 'other', label: small.length === 1 ? agentNameOf(small[0].label) : `${small.length} smaller`, bytes: smallBytes, share: smallBytes / total, path: small.length === 1 ? small[0].path : null, title }]
}
