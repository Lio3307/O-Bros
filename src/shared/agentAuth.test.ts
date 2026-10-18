import { describe, expect, it } from 'vitest'
import { loginWithRule, parseAgentAuthRules, requirementText, unlistedAgentLogins, type AgentAuthRule } from './agentAuth'
import type { AgentLogin } from './agentLogins'

const AMP: AgentAuthRule = { command: 'amp', title: 'Amp', needs: 'account-or-api-key', keyVariables: ['AMP_API_KEY'], signIn: 'Run amp login.' }
const KILO: AgentAuthRule = { command: 'kilo', title: 'Kilo', needs: 'account', keyVariables: [], signIn: 'Run kilo auth login.' }

describe('agent sign-in requirements', () => {
  it('reads valid rules only', () => {
    const rules = parseAgentAuthRules({ agents: [AMP, { ...AMP, needs: 'magic' }, { command: 'x' }] })
    expect(rules).toEqual([AMP])
    expect(requirementText(AMP)).toBe('Needs an account sign-in or an API key (key variables: AMP_API_KEY)')
  })

  it('shows an agent O-BROS cannot read as not checked, with how to sign in', () => {
    const login = loginWithRule(null, AMP, [])
    expect(login).toMatchObject({ kind: 'unknown', manageHint: 'Run amp login.' })
    expect(login.requirement).toContain('AMP_API_KEY')
  })

  it('counts an API key set in the environment, by name only', () => {
    expect(loginWithRule(null, AMP, ['AMP_API_KEY'])).toMatchObject({ kind: 'api-keys', summary: 'API key set in AMP_API_KEY' })
    const signedIn: AgentLogin = { command: 'amp', title: 'Amp', kind: 'account', summary: 'Signed in', providers: [], manageHint: '' }
    expect(loginWithRule(signedIn, AMP, ['AMP_API_KEY']).summary).toBe('Signed in · API key set in AMP_API_KEY')
    expect(loginWithRule(null, AMP, ['OTHER_KEY']).kind).toBe('unknown')
  })

  it('does not treat a key as enough for an agent that needs an account', () => {
    const notSignedIn: AgentLogin = { command: 'kilo', title: 'Kilo', kind: 'none', summary: 'Not signed in', providers: [], manageHint: '' }
    expect(loginWithRule(notSignedIn, KILO, ['ANY_KEY'])).toMatchObject({ kind: 'none', manageHint: 'Run kilo auth login.' })
  })
})

describe('installed agents without a sign-in rule', () => {
  it('lists them as not checked, skipping Claude, Codex and agents that have a rule', () => {
    const installed = new Set(['pi', 'kilo', 'claude', 'vibe'])
    const agents = [
      { title: 'Pi', commands: ['pi'] },
      { title: 'Kilo Code', commands: ['kilo'] },
      { title: 'Claude', commands: ['claude'] },
      { title: 'Mistral Vibe', commands: ['vibe'] },
      { title: 'Vibe again', commands: ['vibe'] },
      { title: 'Not installed', commands: ['junie'] }
    ]
    const logins = unlistedAgentLogins(agents, [KILO], installed)
    expect(logins.map((login) => [login.command, login.title, login.kind])).toEqual([
      ['pi', 'Pi', 'unknown'],
      ['vibe', 'Mistral Vibe', 'unknown']
    ])
    expect(logins[0].manageHint).toBe('Run pi and follow its setup, if it asks for an account or a key.')
  })
})
