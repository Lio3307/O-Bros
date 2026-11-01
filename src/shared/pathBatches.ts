const MAX_BATCH_CHARACTERS = 20_000

export function pathBatches(paths: string[], maxCharacters = MAX_BATCH_CHARACTERS): string[][] {
  const batches: string[][] = []
  let current: string[] = []
  let currentSize = 0
  for (const path of paths) {
    const size = path.length + 3
    if (current.length > 0 && currentSize + size > maxCharacters) {
      batches.push(current)
      current = []
      currentSize = 0
    }
    current.push(path)
    currentSize += size
  }
  if (current.length > 0) {
    batches.push(current)
  }
  return batches
}
