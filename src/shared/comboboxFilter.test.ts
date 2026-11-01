import { describe, expect, it } from 'vitest'
import { filterComboboxOptions, type ComboboxOption } from './comboboxFilter'

const OPTIONS: ComboboxOption[] = [
  { value: 'follow', label: 'Follow selected project', hint: 'nia' },
  { value: 'a', label: 'NevelopWebsite', hint: 'Nevelop-Web-Old', group: 'CompanyRepo' },
  { value: 'b', label: 'dmi', group: 'CompanyRepo' },
  { value: 'c', label: 'pong', group: 'Games' }
]

function valuesFor(query: string): string[] {
  return filterComboboxOptions(OPTIONS, query).map((option) => option.value)
}

describe('filterComboboxOptions', () => {
  it('shows everything for an empty search', () => {
    expect(valuesFor('  ')).toEqual(['follow', 'a', 'b', 'c'])
  })

  it('ignores case and looks in the name and the hint', () => {
    expect(valuesFor('nevelop')).toEqual(['a'])
    expect(valuesFor('WEB-OLD')).toEqual(['a'])
  })

  it('finds everything in a group by the group name', () => {
    expect(valuesFor('games')).toEqual(['c'])
  })

  it('needs every word, in any order', () => {
    expect(valuesFor('old nevelop')).toEqual(['a'])
    expect(valuesFor('dmi games')).toEqual([])
  })
})
