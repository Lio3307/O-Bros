import { EditorView } from '@codemirror/view'

export const editorMotionTheme = EditorView.theme({
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
