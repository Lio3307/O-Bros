export interface PageOf<Item> {
  items: Item[]
  page: number
  pageCount: number
  from: number
  to: number
  total: number
}

export function pageOf<Item>(all: Item[], wantedPage: number, pageSize: number): PageOf<Item> {
  const total = all.length
  const pageCount = Math.max(1, Math.ceil(total / pageSize))
  const page = Math.min(Math.max(1, wantedPage), pageCount)
  const start = (page - 1) * pageSize
  const items = all.slice(start, start + pageSize)
  return { items, page, pageCount, from: total === 0 ? 0 : start + 1, to: start + items.length, total }
}
