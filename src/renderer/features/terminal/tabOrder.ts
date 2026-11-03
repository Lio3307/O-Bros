export function moveItem<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  const reordered = [...items]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}

export function itemBeside<Item>(items: Item[], current: Item, step: 1 | -1): Item | null {
  const index = items.indexOf(current)
  if (index < 0 || items.length < 2) {
    return null
  }
  return items[(index + step + items.length) % items.length]
}
