import { describe, expect, it } from 'vitest'
import { HIDDEN, maskSecrets } from './secretMask'

function fakeKey(prefix: string, length: number): string {
  return prefix + 'Ab1'.repeat(Math.ceil(length / 3)).slice(0, length)
}

function masked(text: string): string {
  return maskSecrets(text).text
}

describe('maskSecrets', () => {
  it('hides keys that start with a known prefix and counts them', () => {
    const openAi = fakeKey('sk-' + 'proj-', 40)
    const gitHub = fakeKey('gh' + 'p_', 36)
    const aws = fakeKey('AK' + 'IA', 16).toUpperCase()
    const result = maskSecrets(`use ${openAi} and ${gitHub}, then ${aws}.`)
    expect(result.text).toBe(`use ${HIDDEN} and ${HIDDEN}, then ${HIDDEN}.`)
    expect(result.hiddenCount).toBe(3)
  })

  it('hides the value of a secret setting in env files, flags and JSON', () => {
    expect(masked('OPENAI_API_KEY=abc123def456')).toBe(`OPENAI_API_KEY=${HIDDEN}`)
    expect(masked('DB_PASSWORD="hunter2!"')).toBe(`DB_PASSWORD="${HIDDEN}"`)
    expect(masked('run --api-key=abc123def456 now')).toBe(`run --api-key=${HIDDEN} now`)
    expect(masked('{"password":"hunter22","user":"ada"}')).toBe(`{"password":"${HIDDEN}","user":"ada"}`)
    expect(masked('"client_secret": "abcd1234",')).toBe(`"client_secret": "${HIDDEN}",`)
    expect(masked('password: hunter22')).toBe(`password: ${HIDDEN}`)
    expect(masked('const password = "hunter22"')).toBe(`const password = "${HIDDEN}"`)
  })

  it('hides secrets inside links: query values and passwords before the host', () => {
    expect(masked('open https://example.com/hook?secret=abc123def&page=2')).toBe(`open https://example.com/hook?secret=${HIDDEN}&page=2`)
    expect(masked('postgres://admin:MyPassw0rd@db.example.com:5432/app')).toBe(`postgres://admin:${HIDDEN}@db.example.com:5432/app`)
  })

  it('hides bearer tokens and private key blocks', () => {
    const token = fakeKey('', 40)
    expect(masked(`Authorization: Bearer ${token}`)).toBe(`Authorization: Bearer ${HIDDEN}`)
    const block = ['-----BEGIN ' + 'RSA PRIVATE KEY-----', 'MIIEpAIBAAKCAQEA', 'abc', '-----END ' + 'RSA PRIVATE KEY-----'].join('\n')
    expect(masked(`key:\n${block}\ndone`)).toBe('key:\n[hidden private key]\ndone')
  })

  it('hides long random words but keeps hashes, ids and paths', () => {
    expect(masked(`token ${fakeKey('', 40)}`)).toBe(`token ${HIDDEN}`)
    const sha = 'a'.repeat(20) + '0123456789abcdef1234'
    expect(masked(`commit ${sha}`)).toBe(`commit ${sha}`)
    expect(masked('id 3f2b9c1e-8a4d-4c7e-9b1a-2d3e4f5a6b7c')).toBe('id 3f2b9c1e-8a4d-4c7e-9b1a-2d3e4f5a6b7c')
    expect(masked('src/features/history/SessionTitle.tsx')).toBe('src/features/history/SessionTitle.tsx')
  })

  it('leaves normal talk and code about secrets alone', () => {
    const text = [
      'The token expired yesterday, so ask for a new one.',
      'const apiKey = process.env.OPENAI_API_KEY',
      'password: string',
      'maxTokens: 4096',
      'key={item.id}',
      'task-runner and sk-learn are fine',
      'Use ${TOKEN} from the vault'
    ].join('\n')
    const result = maskSecrets(text)
    expect(result.text).toBe(text)
    expect(result.hiddenCount).toBe(0)
  })
})
