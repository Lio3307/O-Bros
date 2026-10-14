import { describe, expect, it } from 'vitest'
import { searchCommands } from './commandSearch'

const commands = [
  { title: 'Split right', group: 'Terminal' },
  { title: 'Split down', group: 'Terminal' },
  { title: 'Push', group: 'Git', keywords: ['publish', 'upload'] },
  { title: 'Show the graph', group: 'Git' },
  { title: 'Open Agents', group: 'Settings' }
]

describe('searchCommands', () => {
  it('returns every command, in order, for an empty query', () => {
    expect(searchCommands(commands, '  ')).toEqual(commands)
  })

  it('needs every word to appear in the group, the title or the keywords', () => {
    expect(searchCommands(commands, 'split').map((command) => command.title)).toEqual(['Split right', 'Split down'])
    expect(searchCommands(commands, 'git graph').map((command) => command.title)).toEqual(['Show the graph'])
    expect(searchCommands(commands, 'publish').map((command) => command.title)).toEqual(['Push'])
  })

  it('does not care about case and returns nothing when a word is missing', () => {
    expect(searchCommands(commands, 'SPLIT DOWN').map((command) => command.title)).toEqual(['Split down'])
    expect(searchCommands(commands, 'split nothing')).toEqual([])
  })

  it('puts a title that starts with the query before one that only contains it', () => {
    const list = [
      { title: 'Show the graph', group: 'Git' },
      { title: 'Graph settings', group: 'Settings' }
    ]
    expect(searchCommands(list, 'graph').map((command) => command.title)).toEqual(['Graph settings', 'Show the graph'])
  })
})
