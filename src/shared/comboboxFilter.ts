export interface ComboboxOption {
  value: string
  label: string
  hint?: string
  group?: string
}

export function filterComboboxOptions<Option extends ComboboxOption>(options: Option[], query: string): Option[] {
  const words = query.toLowerCase().split(' ').filter((word) => word !== '')
  return options.filter((option) => {
    const searchable = [option.label, option.hint, option.group].join(' ').toLowerCase()
    return words.every((word) => searchable.includes(word))
  })
}
