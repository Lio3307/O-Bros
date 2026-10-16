const ALLOWED_TAGS = new Set([
  'p',
  'br',
  'hr',
  'pre',
  'code',
  'em',
  'strong',
  'b',
  'i',
  'del',
  's',
  'kbd',
  'span',
  'div',
  'blockquote',
  'ul',
  'ol',
  'li',
  'h1',
  'h2',
  'h3',
  'h4',
  'h5',
  'h6',
  'table',
  'thead',
  'tbody',
  'tr',
  'th',
  'td',
  'a'
])

const DROPPED_WITH_CONTENT = new Set(['script', 'style', 'iframe', 'object', 'embed', 'template', 'noscript', 'svg', 'math'])
const SAFE_LINK_PROTOCOLS = ['https:', 'http:']

export type ElementVerdict = 'keep' | 'unwrap' | 'drop'

export function verdictForTag(tagName: string): ElementVerdict {
  const tag = tagName.toLowerCase()
  if (ALLOWED_TAGS.has(tag)) {
    return 'keep'
  }
  return DROPPED_WITH_CONTENT.has(tag) ? 'drop' : 'unwrap'
}

function isSafeLink(value: string): boolean {
  try {
    return SAFE_LINK_PROTOCOLS.includes(new URL(value).protocol)
  } catch {
    return false
  }
}

export function isAllowedAttribute(tagName: string, name: string, value: string): boolean {
  const tag = tagName.toLowerCase()
  const attribute = name.toLowerCase()
  if (tag === 'a' && attribute === 'href') {
    return isSafeLink(value.trim())
  }
  return attribute === 'class' && (tag === 'code' || tag === 'span' || tag === 'pre' || tag === 'div')
}
