export function moveItem<Item>(items: Item[], fromIndex: number, toIndex: number): Item[] {
  const reordered = [...items]
  const [moved] = reordered.splice(fromIndex, 1)
  reordered.splice(toIndex, 0, moved)
  return reordered
}
