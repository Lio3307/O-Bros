import { useState } from 'react'

export const LIST_BATCH_SIZE = 500

export function useListBatch<Item>(items: Item[]): { shown: Item[]; hiddenCount: number; showMore: () => void } {
  const [limit, setLimit] = useState(LIST_BATCH_SIZE)
  return {
    shown: items.length > limit ? items.slice(0, limit) : items,
    hiddenCount: Math.max(0, items.length - limit),
    showMore: () => setLimit((current) => current + LIST_BATCH_SIZE)
  }
}
