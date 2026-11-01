import { matchesAllWords } from './textSearch'

export interface ComboboxOption {
  value: string
  label: string
  hint?: string
  group?: string
}

export function filterComboboxOptions<Option extends ComboboxOption>(options: Option[], query: string): Option[] {
  return options.filter((option) => matchesAllWords([option.label, option.hint, option.group].join(' '), query))
}
