import { EditorView } from '@codemirror/view'

const CARET_GLIDE = '70ms var(--ease-out)'

export const editorMotionTheme = EditorView.theme({
  '.cm-cursor, .cm-dropCursor': {
    transition: `left ${CARET_GLIDE}, top ${CARET_GLIDE}, height ${CARET_GLIDE}`
  },
  '&.cm-focused > .cm-scroller > .cm-cursorLayer': {
    animationTimingFunction: 'ease-in-out'
  },
  '.cm-activeLine, .cm-activeLineGutter': {
    transition: 'background-color var(--motion-fast) var(--ease-out), color var(--motion-fast) var(--ease-out)'
  },
  '.cm-tooltip': {
    animation: 'motion-pop var(--motion-fast) var(--ease-out)'
  },
  '.cm-panels .cm-panel': {
    animation: 'motion-rise var(--motion-base) var(--ease-out)'
  },
  '.cm-matchingBracket, .cm-nonmatchingBracket': {
    animation: 'motion-fade var(--motion-fast) var(--ease-out)'
  },
  '.cm-lintRange': {
    animation: 'motion-fade var(--motion-slow) var(--ease-out)'
  },
  '.cm-foldPlaceholder': {
    animation: 'motion-fade var(--motion-base) var(--ease-out)'
  }
})
