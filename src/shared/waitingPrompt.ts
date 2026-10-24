const TAIL_LENGTH = 1200
const REPAINT_MATCH_LENGTH = 40
const ESCAPE = '\u001b'
const BELL = '\u0007'

const WAITING_PHRASES = [
  'do you want to proceed',
  'do you want to make this edit',
  'do you want to create',
  'do you want to allow',
  'would you like to run the following command',
  'allow command?',
  'yes, proceed',
  'esc to cancel',
  'press enter to continue',
  '(y/n)',
  '[y/n]',
  '(yes/no)'
]

function isFinalByteOfSequence(character: string): boolean {
  return character >= '@' && character <= '~'
}

export function stripTerminalControl(text: string): string {
  let result = ''
  let index = 0
  while (index < text.length) {
    const character = text.charAt(index)
    if (character !== ESCAPE) {
      result += character === BELL ? '' : character
      index += 1
      continue
    }
    const kind = text.charAt(index + 1)
    index += 2
    if (kind === ']') {
      while (index < text.length && text.charAt(index) !== BELL && text.charAt(index) !== ESCAPE) {
        index += 1
      }
      index += text.charAt(index) === ESCAPE ? 2 : 1
    } else if (kind === '[') {
      while (index < text.length && !isFinalByteOfSequence(text.charAt(index))) {
        index += 1
      }
      index += 1
    }
  }
  return result
}

export function appendToTail(tail: string, chunk: string): string {
  return (tail + stripTerminalControl(chunk)).slice(-TAIL_LENGTH)
}

export function looksLikeWaitingForInput(tail: string): boolean {
  const lowered = tail.toLowerCase()
  return WAITING_PHRASES.some((phrase) => lowered.includes(phrase))
}

export function isRepaintOfQuestion(before: string, after: string): boolean {
  const ending = before.trimEnd().slice(-REPAINT_MATCH_LENGTH)
  return looksLikeWaitingForInput(before) && ending !== '' && after.trimEnd().endsWith(ending)
}

const WORKING_PHRASES = ['esc to interrupt']

export function looksLikeStillWorking(screen: string): boolean {
  const lowered = screen.toLowerCase()
  return WORKING_PHRASES.some((phrase) => lowered.includes(phrase))
}
