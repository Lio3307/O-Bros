import { StreamLanguage, type StreamParser, type StringStream } from '@codemirror/language'

interface EnvState {
  isAfterEquals: boolean
}

const QUOTE_CHARACTERS = ['"', "'", '`']

function isWhitespace(character: string): boolean {
  return character === ' ' || character === '\t'
}

function isNumberWord(word: string): boolean {
  return word !== '' && !Number.isNaN(Number(word))
}

function wordAhead(stream: StringStream): string {
  const rest = stream.string.slice(stream.pos)
  const end = rest.split('').findIndex(isWhitespace)
  return end === -1 ? rest : rest.slice(0, end)
}

function readQuoted(stream: StringStream): string {
  const quote = stream.next() as string
  let isEscaped = false
  let character = stream.next()
  while (character !== undefined) {
    if (character === quote && !isEscaped) {
      break
    }
    isEscaped = character === '\\' && !isEscaped
    character = stream.next()
  }
  return 'string'
}

function readReference(stream: StringStream): string {
  stream.next()
  if (stream.eat('{')) {
    stream.eatWhile((character) => character !== '}')
    stream.eat('}')
  } else {
    stream.eatWhile((character) => !isWhitespace(character) && character !== '"' && character !== "'")
  }
  return 'variableName'
}

function readValueWord(stream: StringStream): string {
  const word = wordAhead(stream)
  stream.pos += word.length
  if (isNumberWord(word)) {
    return 'number'
  }
  return word === 'true' || word === 'false' ? 'atom' : 'string'
}

function readEnvKey(stream: StringStream): string {
  if (stream.match('export ')) {
    return 'keyword'
  }
  stream.eatWhile((character) => character !== '=' && character !== ':')
  return 'propertyName'
}

const envParser: StreamParser<EnvState> = {
  name: 'env',
  startState: () => ({ isAfterEquals: false }),
  token(stream, state) {
    if (stream.sol()) {
      state.isAfterEquals = false
    }
    if (stream.eatSpace()) {
      return null
    }
    if (stream.peek() === '#') {
      stream.skipToEnd()
      return 'comment'
    }
    if (!state.isAfterEquals) {
      if (stream.peek() === '=' || stream.peek() === ':') {
        stream.next()
        state.isAfterEquals = true
        return 'operator'
      }
      return readEnvKey(stream)
    }
    const next = stream.peek() as string
    if (QUOTE_CHARACTERS.includes(next)) {
      return readQuoted(stream)
    }
    if (next === '$') {
      return readReference(stream)
    }
    return readValueWord(stream)
  },
  languageData: { commentTokens: { line: '#' } }
}

const textParser: StreamParser<null> = {
  name: 'text',
  startState: () => null,
  token(stream) {
    if (stream.eatSpace()) {
      return null
    }
    const next = stream.peek() as string
    if (QUOTE_CHARACTERS.includes(next)) {
      return readQuoted(stream)
    }
    const word = wordAhead(stream)
    stream.pos += word.length
    if (word.startsWith('http://') || word.startsWith('https://')) {
      return 'link'
    }
    if (isNumberWord(word)) {
      return 'number'
    }
    if (word.endsWith(':') && stream.string.slice(0, stream.start).trim() === '') {
      return 'propertyName'
    }
    return null
  }
}

export const envLanguage = StreamLanguage.define(envParser)

export const textLanguage = StreamLanguage.define(textParser)
