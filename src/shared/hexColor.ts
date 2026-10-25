const HEX_DIGITS = '0123456789abcdef'
const SHORT_DIGIT_COUNT = 3
const DIGIT_COUNT = 6
const DIGIT_COUNT_WITH_ALPHA = 8

function isHexDigits(text: string): boolean {
  return text.length > 0 && [...text.toLowerCase()].every((character) => HEX_DIGITS.includes(character))
}

export function isHexColor(value: unknown): value is string {
  if (typeof value !== 'string' || !value.startsWith('#')) {
    return false
  }
  const digits = value.slice(1)
  return (digits.length === DIGIT_COUNT || digits.length === DIGIT_COUNT_WITH_ALPHA) && isHexDigits(digits)
}

function digitsOf(text: string): string | null {
  if (text.startsWith('#')) {
    return text.slice(1)
  }
  return text.startsWith('0x') ? text.slice(2) : null
}

export function normalizeHexColor(value: unknown): string | null {
  if (typeof value !== 'string') {
    return null
  }
  const digits = digitsOf(value.trim().toLowerCase())
  if (digits === null || !isHexDigits(digits)) {
    return null
  }
  if (digits.length === SHORT_DIGIT_COUNT) {
    return `#${[...digits].map((digit) => digit + digit).join('')}`
  }
  if (digits.length === DIGIT_COUNT || digits.length === DIGIT_COUNT_WITH_ALPHA) {
    return `#${digits.slice(0, DIGIT_COUNT)}`
  }
  return null
}
