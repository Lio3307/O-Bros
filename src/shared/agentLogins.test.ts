import { describe, expect, it } from 'vitest'
import { clineLogin, copilotLogin, geminiLogin, loginFromAuthFile, providerDisplayName } from './agentLogins'

describe('agent logins', () => {
  it('names providers', () => {
    expect(providerDisplayName('openrouter')).toBe('OpenRouter')
    expect(providerDisplayName('cloudflare-workers-ai')).toBe('Cloudflare Workers AI')
    expect(providerDisplayName('my-custom-box')).toBe('My Custom Box')
  })

  it('lists the providers in an OpenCode style auth file without reading the keys', () => {
    const login = loginFromAuthFile(
      { openrouter: { type: 'api', key: 'secret' }, google: { type: 'api', key: 'secret' } },
      'opencode',
      'OpenCode',
      'hint'
    )
    expect(login).toMatchObject({ kind: 'api-keys', summary: '2 providers connected', providers: ['OpenRouter', 'Google'] })
    expect(JSON.stringify(login)).not.toContain('secret')
    expect(loginFromAuthFile({ kilo: { type: 'oauth', access: 'secret' } }, 'kilo', 'Kilo', 'hint').kind).toBe('account')
    expect(loginFromAuthFile(null, 'kilo', 'Kilo', 'hint').kind).toBe('none')
  })

  it('reads how Gemini CLI signs in', () => {
    expect(geminiLogin({ active: null }, { security: { auth: { selectedType: 'gemini-api-key' } } }).kind).toBe('api-keys')
    expect(geminiLogin({ active: 'me@example.com' }, { security: { auth: { selectedType: 'oauth-personal' } } }).summary).toBe(
      'Google account me@example.com'
    )
    expect(geminiLogin(null, null).kind).toBe('none')
  })

  it('reads the Cline provider and the Copilot GitHub login', () => {
    expect(clineLogin({ lastUsedProvider: 'cline', providers: { cline: {}, openrouter: {} } })).toMatchObject({
      kind: 'account',
      summary: 'Uses Cline account',
      providers: ['Cline account', 'OpenRouter']
    })
    expect(copilotLogin('// comment\n{ "last_logged_in_user": { "host": "https://github.com", "login": "octo" } }').summary).toBe(
      'GitHub account octo'
    )
    expect(copilotLogin('// comment\n{ "firstLaunchAt": "x" }').kind).toBe('none')
  })
})
