import { Compartment, Prec, type Extension } from '@codemirror/state'
import { drawSelection, EditorView } from '@codemirror/view'
import type { CursorShape, EditorSettings } from './editorSettings'

export type CursorSettings = Pick<EditorSettings, 'cursorShape' | 'cursorColor' | 'cursorBlinks' | 'cursorGlides'>

const CURSOR = '.cm-cursor, .cm-dropCursor'
const GLIDE = '70ms var(--ease-out)'

const SHAPE_STYLES: Record<CursorShape, Record<string, string>> = {
  line: { borderLeft: '2px solid var(--caret-color)' },
  block: { borderLeft: 'none', width: '1ch', backgroundColor: 'color-mix(in srgb, var(--caret-color) 70%, transparent)' },
  underline: { borderLeft: 'none', width: '1ch', borderBottom: '2px solid var(--caret-color)' }
}

export const cursorCompartment = new Compartment()

export function cursorExtension(settings: CursorSettings): Extension {
  const rules: Record<string, Record<string, string>> = { [CURSOR]: { ...SHAPE_STYLES[settings.cursorShape] } }
  if (settings.cursorColor !== null) {
    rules['&'] = { '--caret-color': settings.cursorColor }
  }
  if (settings.cursorGlides) {
    rules[CURSOR].transition = `left ${GLIDE}, top ${GLIDE}, height ${GLIDE}`
    rules['&.cm-focused > .cm-scroller > .cm-cursorLayer'] = { animationTimingFunction: 'ease-in-out' }
  }
  const blinking = settings.cursorBlinks ? [] : drawSelection({ cursorBlinkRate: 0 })
  return [Prec.highest(EditorView.theme(rules)), blinking]
}
