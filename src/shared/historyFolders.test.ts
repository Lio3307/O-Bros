import { describe, expect, it } from 'vitest'
import { parseHistoryFolders } from './historyFolders'

describe('parseHistoryFolders', () => {
  it('expands the home folder and drops entries that are incomplete or outside home', () => {
    const folders = parseHistoryFolders(
      {
        folders: [
          { command: 'gemini', title: 'Gemini', path: '{home}/.gemini/tmp', note: 'Chats.' },
          { command: 'opencode', title: 'OpenCode', path: '{home}/.local/share/opencode', note: 'Sessions.', holdsLogin: true },
          { command: 'bad', title: 'Outside home', path: 'C:/Windows', note: 'No.' },
          { command: 'empty', title: '', path: '{home}/.x', note: 'No title.' }
        ]
      },
      'C:/Users/me'
    )
    expect(folders).toEqual([
      { command: 'gemini', title: 'Gemini', path: 'C:/Users/me/.gemini/tmp', note: 'Chats.', holdsLogin: false },
      { command: 'opencode', title: 'OpenCode', path: 'C:/Users/me/.local/share/opencode', note: 'Sessions.', holdsLogin: true }
    ])
  })

  it('returns nothing for a broken file', () => {
    expect(parseHistoryFolders(null, 'C:/Users/me')).toEqual([])
  })
})
