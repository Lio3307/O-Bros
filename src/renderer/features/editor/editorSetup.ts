import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from '@codemirror/autocomplete'
import { defaultKeymap, history, historyKeymap } from '@codemirror/commands'
import { bracketMatching, defaultHighlightStyle, foldGutter, foldKeymap, indentOnInput, syntaxHighlighting } from '@codemirror/language'
import { lintKeymap } from '@codemirror/lint'
import { highlightSelectionMatches, searchKeymap } from '@codemirror/search'
import { EditorState, type Extension } from '@codemirror/state'
import {
  crosshairCursor,
  drawSelection,
  dropCursor,
  EditorView,
  highlightActiveLine,
  highlightActiveLineGutter,
  highlightSpecialChars,
  keymap,
  lineNumbers,
  rectangularSelection
} from '@codemirror/view'

const SVG_NAMESPACE = 'http://www.w3.org/2000/svg'
const CHEVRON_PATH = 'm9 18 6-6-6-6'

function foldMarker(isOpen: boolean): HTMLElement {
  const marker = document.createElement('span')
  marker.className = isOpen ? 'cm-fold-marker cm-fold-marker-open' : 'cm-fold-marker cm-fold-marker-closed'
  marker.title = isOpen ? 'Fold' : 'Unfold'
  const icon = document.createElementNS(SVG_NAMESPACE, 'svg')
  icon.setAttribute('viewBox', '0 0 24 24')
  icon.setAttribute('width', '14')
  icon.setAttribute('height', '14')
  icon.setAttribute('fill', 'none')
  icon.setAttribute('stroke', 'currentColor')
  icon.setAttribute('stroke-width', '2')
  icon.setAttribute('stroke-linecap', 'round')
  icon.setAttribute('stroke-linejoin', 'round')
  icon.setAttribute('aria-hidden', 'true')
  const path = document.createElementNS(SVG_NAMESPACE, 'path')
  path.setAttribute('d', CHEVRON_PATH)
  icon.appendChild(path)
  marker.appendChild(icon)
  return marker
}

const foldMarkerTheme = EditorView.theme({
  '.cm-foldGutter .cm-gutterElement': { display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' },
  '.cm-fold-marker': {
    display: 'grid',
    placeItems: 'center',
    width: '16px',
    height: '100%',
    opacity: '0',
    transition: 'opacity var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)'
  },
  '.cm-fold-marker svg': { transition: 'transform var(--motion-fast) var(--ease-out)' },
  '.cm-fold-marker-open svg': { transform: 'rotate(90deg)' },
  '.cm-gutters:hover .cm-fold-marker, .cm-fold-marker-closed': { opacity: '1' },
  '.cm-fold-marker:hover': { color: 'var(--color-strong)' }
})

export const editorSetup: Extension = [
  lineNumbers(),
  highlightActiveLineGutter(),
  highlightSpecialChars(),
  history(),
  foldGutter({ markerDOM: foldMarker }),
  foldMarkerTheme,
  drawSelection(),
  dropCursor(),
  EditorState.allowMultipleSelections.of(true),
  indentOnInput(),
  syntaxHighlighting(defaultHighlightStyle, { fallback: true }),
  bracketMatching(),
  closeBrackets(),
  autocompletion(),
  rectangularSelection(),
  crosshairCursor(),
  highlightActiveLine(),
  highlightSelectionMatches(),
  keymap.of([...closeBracketsKeymap, ...defaultKeymap, ...searchKeymap, ...historyKeymap, ...foldKeymap, ...completionKeymap, ...lintKeymap])
]
