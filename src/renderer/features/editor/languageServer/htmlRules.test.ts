import { describe, expect, it } from 'vitest'
import { isAllowedAttribute, verdictForTag } from './htmlRules'

describe('language server HTML rules', () => {
  it('keeps formatting tags, removes scripts with their content and unwraps unknown tags', () => {
    expect(verdictForTag('PRE')).toBe('keep')
    expect(verdictForTag('a')).toBe('keep')
    expect(verdictForTag('script')).toBe('drop')
    expect(verdictForTag('iframe')).toBe('drop')
    expect(verdictForTag('img')).toBe('unwrap')
    expect(verdictForTag('form')).toBe('unwrap')
  })

  it('allows only web links and code classes', () => {
    expect(isAllowedAttribute('a', 'href', 'https://example.com/docs')).toBe(true)
    expect(isAllowedAttribute('a', 'href', 'javascript:alert(1)')).toBe(false)
    expect(isAllowedAttribute('a', 'href', ' JavaScript:alert(1)')).toBe(false)
    expect(isAllowedAttribute('a', 'href', 'file:///C:/secret')).toBe(false)
    expect(isAllowedAttribute('a', 'onclick', 'x')).toBe(false)
    expect(isAllowedAttribute('code', 'class', 'language-ts')).toBe(true)
    expect(isAllowedAttribute('img', 'src', 'https://x')).toBe(false)
    expect(isAllowedAttribute('span', 'style', 'color: red')).toBe(false)
  })
})
