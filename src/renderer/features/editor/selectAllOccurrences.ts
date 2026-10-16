import { EditorSelection, type SelectionRange } from '@codemirror/state'
import type { EditorView } from '@codemirror/view'

function isWordCharacter(character: string): boolean {
  const isLetterOrDigit = character.toLowerCase() !== character.toUpperCase() || (character >= '0' && character <= '9')
  return isLetterOrDigit || character === '_' || character === '$'
}

function isWholeWordAt(text: string, from: number, to: number): boolean {
  const before = from === 0 ? '' : text.charAt(from - 1)
  const after = to >= text.length ? '' : text.charAt(to)
  return !(before !== '' && isWordCharacter(before)) && !(after !== '' && isWordCharacter(after))
}

export function occurrenceRanges(text: string, word: string): { from: number; to: number }[] {
  const ranges: { from: number; to: number }[] = []
  if (word === '') {
    return ranges
  }
  const requiresWholeWord = word.split('').every(isWordCharacter)
  let index = text.indexOf(word)
  while (index !== -1) {
    const end = index + word.length
    if (!requiresWholeWord || isWholeWordAt(text, index, end)) {
      ranges.push({ from: index, to: end })
    }
    index = text.indexOf(word, end)
  }
  return ranges
}

function wordUnderCursor(view: EditorView): string {
  const main = view.state.selection.main
  if (!main.empty) {
    return view.state.sliceDoc(main.from, main.to)
  }
  const word = view.state.wordAt(main.head)
  return word === null ? '' : view.state.sliceDoc(word.from, word.to)
}

export function selectAllOccurrences(view: EditorView): boolean {
  const word = wordUnderCursor(view)
  const ranges = occurrenceRanges(view.state.doc.toString(), word)
  if (ranges.length === 0) {
    return false
  }
  const head = view.state.selection.main.head
  const mainIndex = Math.max(
    0,
    ranges.findIndex((range) => head >= range.from && head <= range.to)
  )
  const selections: SelectionRange[] = ranges.map((range) => EditorSelection.range(range.from, range.to))
  view.dispatch({ selection: EditorSelection.create(selections, mainIndex), scrollIntoView: true })
  return true
}
