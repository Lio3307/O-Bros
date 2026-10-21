export const HIDDEN = '[hidden]'
const HIDDEN_KEY_BLOCK = '[hidden private key]'
const MIN_PREFIXED_KEY_LENGTH = 16
const MIN_RANDOM_KEY_LENGTH = 32
const MIN_VALUE_LENGTH = 4
const KEY_BLOCK_START = '-----BEGIN '
const KEY_BLOCK_LABEL = 'PRIVATE KEY-----'
const KEY_BLOCK_END = '-----END '
const BLOCK_DASHES = '-----'

const KEY_PREFIXES = [
  'sk-ant-',
  'sk-proj-',
  'sk-or-',
  'sk-',
  'sk_live_',
  'sk_test_',
  'rk_live_',
  'rk_test_',
  'whsec_',
  'ghp_',
  'gho_',
  'ghu_',
  'ghs_',
  'ghr_',
  'github_pat_',
  'glpat-',
  'xoxb-',
  'xoxp-',
  'xoxa-',
  'xoxs-',
  'xapp-',
  'AKIA',
  'ASIA',
  'AIza',
  'hf_',
  'npm_',
  'pypi-',
  'SG.',
  'shpat_',
  'dop_v1_',
  'gsk_',
  'r8_',
  'eyJ'
]

const SECRET_WORDS = [
  'secret',
  'token',
  'password',
  'passwd',
  'passphrase',
  'apikey',
  'accesskey',
  'privatekey',
  'credential',
  'authorization',
  'cookie'
]

const SECRET_ENDINGS = ['key', 'pwd', 'pass', 'auth']
const BEARER_WORDS = ['bearer', 'basic', 'token']
const MIN_BEARER_VALUE_LENGTH = 16
const LONE_ASSIGNMENTS = ['=', ':', ':=', '=>']
const VALUE_STOPS = '"\'`&,;)]}>< \t\r\n'
const NOT_SECRET_VALUES = ['string', 'number', 'boolean', 'any', 'unknown', 'true', 'false', 'null', 'none', 'undefined', 'required', 'optional', HIDDEN]
const REFERENCE_STARTS = ['{', '(', '[', '$', '<', '%', '*', 'process.env', 'os.environ', 'import.meta', 'env.', 'env(', 'getenv', 'secrets.', 'config.', 'settings.']

export interface MaskResult {
  text: string
  hiddenCount: number
}

function isLetter(character: string): boolean {
  const lower = character.toLowerCase()
  return lower !== character.toUpperCase() || (lower >= 'a' && lower <= 'z')
}

function isDigit(character: string): boolean {
  return character >= '0' && character <= '9'
}

function isKeyCharacter(character: string): boolean {
  return isLetter(character) || isDigit(character) || character === '-' || character === '_' || character === '.'
}

function isWhitespace(character: string): boolean {
  return character === ' ' || character === '\t' || character === '\r' || character === '\n'
}

function normalizedName(name: string): string {
  let result = ''
  for (const character of name.toLowerCase()) {
    if (isLetter(character) || isDigit(character)) {
      result += character
    }
  }
  return result
}

export function isSecretName(name: string): boolean {
  const normalized = normalizedName(name)
  if (normalized === '') {
    return false
  }
  return SECRET_WORDS.some((word) => normalized.includes(word)) || SECRET_ENDINGS.some((ending) => normalized.endsWith(ending))
}

function isAllDigits(value: string): boolean {
  return value.split('').every(isDigit)
}

function looksLikeSecretValue(value: string, minLength: number = MIN_VALUE_LENGTH): boolean {
  const lower = value.toLowerCase()
  if (value.length < minLength || BEARER_WORDS.includes(lower) || isAllDigits(value) || NOT_SECRET_VALUES.includes(lower)) {
    return false
  }
  return !REFERENCE_STARTS.some((start) => lower.startsWith(start))
}

function looksRandom(word: string): boolean {
  if (word.length < MIN_RANDOM_KEY_LENGTH) {
    return false
  }
  let hasUpper = false
  let hasLower = false
  let hasDigit = false
  for (const character of word) {
    if (isDigit(character)) {
      hasDigit = true
    } else if (character >= 'a' && character <= 'z') {
      hasLower = true
    } else if (character >= 'A' && character <= 'Z') {
      hasUpper = true
    } else if (character !== '-' && character !== '_') {
      return false
    }
  }
  return hasUpper && hasLower && hasDigit
}

class Masker {
  hiddenCount = 0

  hide(replacement: string = HIDDEN): string {
    this.hiddenCount += 1
    return replacement
  }

  maskKeyBlocks(text: string): string {
    let result = ''
    let index = 0
    while (index < text.length) {
      const start = text.indexOf(KEY_BLOCK_START, index)
      const labelAt = start < 0 ? -1 : text.indexOf(KEY_BLOCK_LABEL, start)
      const lineEnd = start < 0 ? -1 : text.indexOf('\n', start)
      if (start < 0 || labelAt < 0 || (lineEnd >= 0 && labelAt > lineEnd)) {
        return result + text.slice(index)
      }
      const endAt = text.indexOf(KEY_BLOCK_END, labelAt)
      const closingDashes = endAt < 0 ? -1 : text.indexOf(BLOCK_DASHES, endAt + KEY_BLOCK_END.length)
      result += text.slice(index, start) + this.hide(HIDDEN_KEY_BLOCK)
      index = closingDashes < 0 ? text.length : closingDashes + BLOCK_DASHES.length
    }
    return result
  }

  maskUrlPassword(word: string): string {
    const schemeEnd = word.indexOf('://')
    if (schemeEnd < 0) {
      return word
    }
    const hostStart = schemeEnd + 3
    const pathStart = word.indexOf('/', hostStart)
    const authorityEnd = pathStart < 0 ? word.length : pathStart
    const at = word.lastIndexOf('@', authorityEnd)
    const colon = word.indexOf(':', hostStart)
    if (at < hostStart || colon < 0 || colon > at || at - colon <= 1) {
      return word
    }
    return word.slice(0, colon + 1) + this.hide() + word.slice(at)
  }

  maskPrefixedKeys(word: string): string {
    let result = ''
    let index = 0
    while (index < word.length) {
      const isBoundary = index === 0 || !isKeyCharacter(word.charAt(index - 1))
      const prefix = isBoundary ? KEY_PREFIXES.find((candidate) => word.startsWith(candidate, index)) : undefined
      if (prefix === undefined) {
        result += word.charAt(index)
        index += 1
        continue
      }
      let end = index + prefix.length
      while (end < word.length && isKeyCharacter(word.charAt(end))) {
        end += 1
      }
      while (end > index + prefix.length && word.charAt(end - 1) === '.') {
        end -= 1
      }
      if (end - index - prefix.length < MIN_PREFIXED_KEY_LENGTH) {
        result += word.slice(index, end)
      } else {
        result += this.hide()
      }
      index = end
    }
    return result
  }

  maskAssignments(word: string): string {
    let result = ''
    let index = 0
    while (index < word.length) {
      const character = word.charAt(index)
      const isAssignment = (character === '=' || character === ':') && !word.startsWith('://', index)
      if (!isAssignment) {
        result += character
        index += 1
        continue
      }
      const nameEnd = index > 0 && (word.charAt(index - 1) === '"' || word.charAt(index - 1) === "'") ? index - 1 : index
      let nameStart = nameEnd
      while (nameStart > 0 && isKeyCharacter(word.charAt(nameStart - 1))) {
        nameStart -= 1
      }
      result += character
      index += 1
      if (!isSecretName(word.slice(nameStart, nameEnd))) {
        continue
      }
      const quote = word.charAt(index) === '"' || word.charAt(index) === "'" ? word.charAt(index) : ''
      const valueStart = index + quote.length
      let valueEnd = valueStart
      while (valueEnd < word.length && !VALUE_STOPS.includes(word.charAt(valueEnd))) {
        valueEnd += 1
      }
      const value = word.slice(valueStart, valueEnd)
      result += quote + (looksLikeSecretValue(value) ? this.hide() : value)
      index = valueEnd
    }
    return result
  }

  maskValueWord(word: string, minLength: number): string {
    let start = 0
    let end = word.length
    while (start < end && VALUE_STOPS.includes(word.charAt(start))) {
      start += 1
    }
    while (end > start && VALUE_STOPS.includes(word.charAt(end - 1))) {
      end -= 1
    }
    const value = word.slice(start, end)
    return looksLikeSecretValue(value, minLength) ? word.slice(0, start) + this.hide() + word.slice(end) : word
  }

  maskRandomWord(word: string): string {
    let start = 0
    let end = word.length
    while (start < end && !isKeyCharacter(word.charAt(start))) {
      start += 1
    }
    while (end > start && !isKeyCharacter(word.charAt(end - 1))) {
      end -= 1
    }
    return looksRandom(word.slice(start, end)) ? word.slice(0, start) + this.hide() + word.slice(end) : word
  }

  maskValueAfter(word: string, before: string[]): string | null {
    const [previous, earlier] = before
    const name = LONE_ASSIGNMENTS.includes(previous) ? earlier : previous.endsWith(':') || previous.endsWith('=') ? previous.slice(0, -1) : null
    if (name !== null && isSecretName(name)) {
      return this.maskValueWord(word, MIN_VALUE_LENGTH)
    }
    if (BEARER_WORDS.includes(normalizedName(previous)) && previous.length <= normalizedName(previous).length + 1) {
      return this.maskValueWord(word, MIN_BEARER_VALUE_LENGTH)
    }
    return null
  }

  maskWord(word: string, before: string[]): string {
    const masked = this.maskValueAfter(word, before)
    if (masked !== null && masked !== word) {
      return masked
    }
    return this.maskRandomWord(this.maskAssignments(this.maskPrefixedKeys(this.maskUrlPassword(word))))
  }

  maskWords(text: string): string {
    let result = ''
    let word = ''
    let before = ['', '']
    const flush = (): void => {
      if (word !== '') {
        result += this.maskWord(word, before)
        before = [word, before[0]]
        word = ''
      }
    }
    for (const character of text) {
      if (isWhitespace(character)) {
        flush()
        result += character
      } else {
        word += character
      }
    }
    flush()
    return result
  }
}

export function maskSecrets(text: string): MaskResult {
  const masker = new Masker()
  const masked = masker.maskWords(masker.maskKeyBlocks(text))
  return { text: masked, hiddenCount: masker.hiddenCount }
}
