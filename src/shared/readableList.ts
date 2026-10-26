export function readableList(items: string[], maxShown: number): string {
  const shown = items.slice(0, maxShown)
  const hiddenCount = items.length - shown.length
  const parts = hiddenCount > 0 ? [...shown, `${hiddenCount} more`] : shown
  if (parts.length <= 1) {
    return parts.join('')
  }
  return `${parts.slice(0, -1).join(', ')} and ${parts[parts.length - 1]}`
}
