import { describe, expect, it } from 'vitest'
import { agentStatusOf, newAgentActivity, withOutput, withResize, withScreen, withTyping, type AgentActivity } from './agentStatus'

const START = 1_000_000
const ENTER = String.fromCharCode(13)
const QUESTION = 'Do you want to proceed?\n❯ 1. Yes\n  2. No'
const SHELL_QUESTION = "PS> Read-Host 'Continue? (y/n)'\nContinue? (y/n): "
const SHELL_ANSWERED = "PS> Read-Host 'Continue? (y/n)'\nContinue? (y/n): y\ny\nPS> "

function outputEverySecond(activity: AgentActivity, from: number, to: number): AgentActivity {
  let current = activity
  for (let at = from; at <= to; at += 1000) {
    current = withOutput(current, at)
  }
  return current
}

function sentTask(at: number): AgentActivity {
  return withTyping(newAgentActivity(START), ENTER, '', at)
}

describe('agentStatusOf', () => {
  it('is starting first, then ready while nobody gave it work', () => {
    const banner = withOutput(newAgentActivity(START), START + 1500)
    expect(agentStatusOf(banner, '', START + 2000)).toBe('starting')
    expect(agentStatusOf(banner, '', START + 9000)).toBe('ready')
  })

  it('works after a task is sent, and is done once it goes quiet', () => {
    const working = outputEverySecond(sentTask(START + 20_000), START + 20_200, START + 30_000)
    expect(agentStatusOf(working, '', START + 30_500)).toBe('working')
    expect(agentStatusOf(working, '', START + 36_000)).toBe('done')
  })

  it('asks while a question is on the screen and it has gone quiet', () => {
    const asked = outputEverySecond(sentTask(START + 20_000), START + 20_200, START + 25_000)
    expect(agentStatusOf(asked, QUESTION, START + 25_500)).toBe('working')
    expect(agentStatusOf(asked, QUESTION, START + 27_000)).toBe('asking')
    expect(agentStatusOf(asked, '✻ Working…', START + 30_000)).toBe('done')
  })

  it('stops asking once the user answers, even when the question stays on the screen', () => {
    const asked = withOutput(sentTask(START + 20_000), START + 21_000)
    expect(agentStatusOf(asked, SHELL_QUESTION, START + 25_000)).toBe('asking')
    const answered = withOutput(withTyping(asked, ENTER, "PS> Read-Host 'Continue? (y/n)'\nContinue? (y/n): y", START + 30_000), START + 30_100)
    expect(agentStatusOf(answered, SHELL_ANSWERED, START + 40_000)).toBe('done')
    const repainted = withOutput(withResize(answered, START + 50_000), START + 50_100)
    expect(agentStatusOf(withScreen(repainted, SHELL_ANSWERED), SHELL_ANSWERED, START + 60_000)).toBe('done')
  })

  it('counts an answer the screen showed only after Enter, and asks again for a second question', () => {
    const asked = withOutput(sentTask(START + 20_000), START + 21_000)
    const answered = withOutput(withTyping(asked, ENTER, SHELL_QUESTION, START + 30_000), START + 30_100)
    expect(agentStatusOf(withScreen(answered, SHELL_ANSWERED), SHELL_ANSWERED, START + 40_000)).toBe('done')
    const askedAgain = `${SHELL_ANSWERED}\nContinue? (y/n): `
    expect(agentStatusOf(withScreen(answered, askedAgain), askedAgain, START + 40_000)).toBe('asking')
  })

  it('asks again when the same question comes back after it left the screen', () => {
    const answered = withTyping(withOutput(sentTask(START + 20_000), START + 21_000), ENTER, QUESTION, START + 25_000)
    expect(agentStatusOf(answered, QUESTION, START + 40_000)).toBe('done')
    const cleared = withScreen(answered, '⏺ Ran npm test')
    expect(agentStatusOf(cleared, QUESTION, START + 40_000)).toBe('asking')
  })

  it('sees a question printed right after a resize or right after Enter', () => {
    const done = outputEverySecond(sentTask(START + 20_000), START + 20_200, START + 30_000)
    expect(agentStatusOf(withOutput(withResize(done, START + 40_000), START + 40_100), QUESTION, START + 45_000)).toBe('asking')
    const typed = withTyping(done, 'x', '', START + 50_000)
    const submitted = withOutput(withTyping(typed, ENTER, '', START + 50_050), START + 50_150)
    expect(agentStatusOf(submitted, SHELL_QUESTION, START + 52_000)).toBe('asking')
  })

  it('keeps working while the agent says it can be interrupted, even when quiet', () => {
    expect(agentStatusOf(sentTask(START + 20_000), '✻ Thinking… (esc to interrupt)', START + 40_000)).toBe('working')
  })

  it('does not count the echo of typing or a redraw after a resize as work', () => {
    const done = outputEverySecond(sentTask(START + 20_000), START + 20_200, START + 30_000)
    const typed = withOutput(withTyping(done, 'h', '', START + 50_000), START + 50_100)
    expect(agentStatusOf(typed, '', START + 50_200)).toBe('done')
    const resized = withOutput(withResize(done, START + 60_000), START + 60_200)
    expect(agentStatusOf(resized, '', START + 60_300)).toBe('done')
  })

  it('counts a long run of output as work when the task was typed in by O-BROS', () => {
    const handoff = outputEverySecond(newAgentActivity(START), START + 10_000, START + 20_000)
    expect(agentStatusOf(handoff, '', START + 30_000)).toBe('done')
  })
})
