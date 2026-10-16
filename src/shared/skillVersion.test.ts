import { describe, expect, it } from 'vitest'
import { compareVersions, skillVersionOf } from './skillVersion'

describe('skillVersionOf', () => {
  it('reads the version from the frontmatter metadata', () => {
    const text = '---\nname: wot\nmetadata:\n  version: "1.2.0"\n---\n# wot\nversion: 9.9.9'
    expect(skillVersionOf(text)).toBe('1.2.0')
  })

  it('handles Windows line endings and missing versions', () => {
    expect(skillVersionOf('---\r\nname: wot\r\nmetadata:\r\n  version: 2.0.1\r\n---\r\n')).toBe('2.0.1')
    expect(skillVersionOf('---\nname: wot\n---\n')).toBeNull()
    expect(skillVersionOf('no frontmatter')).toBeNull()
  })
})

describe('compareVersions', () => {
  it('compares numbers part by part', () => {
    expect(compareVersions('1.10.0', '1.9.0')).toBeGreaterThan(0)
    expect(compareVersions('1.1', '1.1.0')).toBe(0)
    expect(compareVersions('1.0.0', '1.1.0')).toBeLessThan(0)
  })
})
