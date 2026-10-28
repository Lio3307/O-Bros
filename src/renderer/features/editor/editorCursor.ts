import { Compartment, Prec, type Extension } from '@codemirror/state'
import { drawSelection, EditorView } from '@codemirror/view'
import type { CursorShape, EditorSettings } from './editorSettings'
import { smoothCaret } from './smoothCaret'

export type CursorSettings = Pick<EditorSettings, 'cursorShape' | 'cursorColor' | 'cursorBlinks' | 'cursorGlides' | 'vimMode'>

const CURSOR = '.cm-cursor, .cm-dropCursor'

const SHAPE_STYLES: Record<CursorShape, Record<string, string>> = {
  line: { borderLeft: '2px solid var(--caret-color)', marginLeft: '-1px' },
  block: { borderLeft: 'none', width: '1ch', backgroundColor: 'color-mix(in srgb, var(--caret-color) 70%, transparent)' },
  underline: { borderLeft: 'none', width: '1ch', borderBottom: '2px solid var(--caret-color)' }
}

export const cursorCompartment = new Compartment()

export function cursorExtension(settings: CursorSettings): Extension {
  const shape = SHAPE_STYLES[settings.cursorShape]
  const rules: Record<string, Record<string, string>> = { [CURSOR]: shape }
  if (settings.cursorColor !== null) {
    rules['&'] = { '--caret-color': settings.cursorColor }
  }
  const glides = settings.cursorGlides && !settings.vimMode
  return [
    Prec.highest(EditorView.theme(rules)),
    settings.cursorBlinks ? [] : drawSelection({ cursorBlinkRate: 0 }),
    glides ? Prec.highest(smoothCaret(shape, settings.cursorBlinks)) : []
  ]
}
