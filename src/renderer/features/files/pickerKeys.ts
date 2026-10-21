import type { KeyboardEvent } from 'react'

interface Picker<T> {
  items: T[]
  selectedIndex: number
  setSelectedIndex: (index: number) => void
  onClose: () => void
  onPick: (item: T) => void
}

export function handlePickerKey<T>(event: KeyboardEvent<HTMLInputElement>, picker: Picker<T>): void {
  const { items, selectedIndex, setSelectedIndex } = picker
  if (event.key === 'Escape') {
    picker.onClose()
  } else if (event.key === 'ArrowDown') {
    event.preventDefault()
    setSelectedIndex(Math.min(selectedIndex + 1, items.length - 1))
  } else if (event.key === 'ArrowUp') {
    event.preventDefault()
    setSelectedIndex(Math.max(selectedIndex - 1, 0))
  } else if (event.key === 'Enter' && items[selectedIndex] !== undefined) {
    picker.onPick(items[selectedIndex])
  }
}
