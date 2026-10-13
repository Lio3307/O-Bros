import { describe, expect, it } from 'vitest'
import { buildRunCommand, detectPackageManager, isSafeScriptName, parsePackageScripts } from './scripts'

describe('parsePackageScripts', () => {
  it('lists the scripts of a package.json', () => {
    const text = JSON.stringify({ scripts: { dev: 'vite', test: 'vitest run' } })
    expect(parsePackageScripts(text)).toEqual([
      { name: 'dev', command: 'vite' },
      { name: 'test', command: 'vitest run' }
    ])
  })

  it('returns nothing for broken or script-less files', () => {
    expect(parsePackageScripts('not json')).toEqual([])
    expect(parsePackageScripts('{}')).toEqual([])
    expect(parsePackageScripts('{"scripts": []}')).toEqual([])
  })

  it('ignores scripts whose command is not text', () => {
    expect(parsePackageScripts('{"scripts": {"a": 1, "b": "ok"}}')).toEqual([{ name: 'b', command: 'ok' }])
  })
})

describe('detectPackageManager', () => {
  it('uses the lock file that is present', () => {
    expect(detectPackageManager(['package.json', 'pnpm-lock.yaml'])).toBe('pnpm')
    expect(detectPackageManager(['bun.lock'])).toBe('bun')
    expect(detectPackageManager(['yarn.lock'])).toBe('yarn')
  })

  it('falls back to npm', () => {
    expect(detectPackageManager(['package.json', 'package-lock.json'])).toBe('npm')
  })
})

describe('isSafeScriptName and buildRunCommand', () => {
  it('accepts usual script names and rejects shell characters', () => {
    expect(isSafeScriptName('build:prod')).toBe(true)
    expect(isSafeScriptName('dev; rm -rf')).toBe(false)
    expect(isSafeScriptName('')).toBe(false)
  })

  it('builds the command for each manager', () => {
    expect(buildRunCommand('npm', 'dev')).toBe('npm run dev')
    expect(buildRunCommand('yarn', 'dev')).toBe('yarn dev')
  })
})
