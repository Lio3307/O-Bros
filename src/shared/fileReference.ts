import { fileExtension } from './paths'

export interface FileReference {
  path: string
  line: number
  column: number
  start: number
  end: number
}

const LEADING_MARKS = '"\'`[<{('
const TRAILING_MARKS = '"\'`]>},;.:)'
const TRAILING_MARKS_KEEPING_PAREN = '"\'`]>},;.:'
const MAX_EXTENSION_LENGTH = 10

interface Word {
  text: string
  start: number
}

function isDigits(text: string): boolean {
  return text !== '' && Array.from(text).every((character) => character >= '0' && character <= '9')
}

function splitWords(text: string): Word[] {
  const words: Word[] = []
  let wordStart = -1
  for (let index = 0; index <= text.length; index += 1) {
    const isSeparator = index === text.length || text[index] === ' ' || text[index] === '\t'
    if (!isSeparator && wordStart < 0) {
      wordStart = index
    } else if (isSeparator && wordStart >= 0) {
      words.push({ text: text.slice(wordStart, index), start: wordStart })
      wordStart = -1
    }
  }
  return words
}

function trimWord(word: Word, leadingMarks: string, trailingMarks: string): Word {
  let start = 0
  let end = word.text.length
  while (start < end && leadingMarks.includes(word.text[start])) {
    start += 1
  }
  while (end > start && trailingMarks.includes(word.text[end - 1])) {
    end -= 1
  }
  return { text: word.text.slice(start, end), start: word.start + start }
}

function looksLikeFilePath(path: string): boolean {
  if (path === '' || path.includes('://')) {
    return false
  }
  const extension = fileExtension(path)
  return extension !== '' && extension.length <= MAX_EXTENSION_LENGTH && !isDigits(extension)
}

function buildReference(path: string, numbers: number[], word: Word): FileReference | null {
  const [line, column] = numbers
  if (!looksLikeFilePath(path) || line < 1) {
    return null
  }
  return { path, line, column: column ?? 1, start: word.start, end: word.start + word.text.length }
}

function parseParenForm(word: Word): FileReference | null {
  const openIndex = word.text.lastIndexOf('(')
  if (openIndex <= 0 || !word.text.endsWith(')')) {
    return null
  }
  const numberTexts = word.text.slice(openIndex + 1, -1).split(',')
  const isNumeric = numberTexts.length <= 2 && numberTexts.every(isDigits)
  return isNumeric ? buildReference(word.text.slice(0, openIndex), numberTexts.map(Number), word) : null
}

function parseColonForm(word: Word): FileReference | null {
  const parts = word.text.split(':')
  const numbers: number[] = []
  let pathPartCount = parts.length
  while (pathPartCount > 1 && numbers.length < 2 && isDigits(parts[pathPartCount - 1])) {
    pathPartCount -= 1
    numbers.unshift(Number(parts[pathPartCount]))
  }
  if (numbers.length === 0) {
    return null
  }
  return buildReference(parts.slice(0, pathPartCount).join(':'), numbers, word)
}

export function findFileReferences(text: string): FileReference[] {
  const references: FileReference[] = []
  for (const word of splitWords(text)) {
    const parenWord = trimWord(word, LEADING_MARKS.replace('(', ''), TRAILING_MARKS_KEEPING_PAREN)
    const colonWord = trimWord(word, LEADING_MARKS, TRAILING_MARKS)
    const reference = parseParenForm(parenWord) ?? parseColonForm(colonWord)
    if (reference !== null) {
      references.push(reference)
    }
  }
  return references
}
