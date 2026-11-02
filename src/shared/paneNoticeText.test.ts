import { describe, expect, it } from 'vitest'
import { describePaneNotice } from './paneNoticeText'

describe('describePaneNotice', () => {
  it('names who finished in the title and where in the body', () => {
    const notice = describePaneNotice('finished', { agentLabel: 'Gemini', folderName: 'nia', customTabTitle: null, paneTitle: null })
    expect(notice.title).toBe('Gemini finished its reply')
    expect(notice.body).toContain('In nia.')
  })

  it('says command when no agent runs in the terminal', () => {
    const source = { agentLabel: null, folderName: 'nia', customTabTitle: null, paneTitle: null }
    expect(describePaneNotice('finished', source).title).toBe('Command finished')
    expect(describePaneNotice('asking', source).title).toBe('A command is asking you a question')
  })

  it('adds the tab name the user gave it, to tell tabs of one folder apart', () => {
    const notice = describePaneNotice('asking', { agentLabel: 'Gemini', folderName: 'nia', customTabTitle: 'login bug', paneTitle: null })
    expect(notice.body).toContain('In nia, tab "login bug".')
  })

  it('puts the pane name in the title, to tell two panes of the same agent apart', () => {
    const source = { agentLabel: 'Gemini', folderName: 'nia', customTabTitle: null, paneTitle: 'Terminal 2' }
    expect(describePaneNotice('finished', source).title).toBe('Gemini finished its reply: Terminal 2')
    expect(describePaneNotice('asking', source).title).toBe('Gemini is asking you a question: Terminal 2')
    expect(describePaneNotice('finished', { ...source, agentLabel: null }).title).toBe('Command finished: Terminal 2')
    expect(describePaneNotice('finished', source).body).not.toContain('Terminal 2')
  })
})
