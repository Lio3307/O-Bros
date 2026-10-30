import { Compartment, type Extension } from '@codemirror/state'
import { syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import type { ColorTheme } from '../../theme/colorThemes'
import { isDarkTheme } from '../../theme/themeDerivation'
import { codeHighlightStyle } from './codeHighlightStyle'
import { indentGuides } from './indentGuides'

export const colorThemeCompartment = new Compartment()

function seeThrough(color: string): string {
  return `color-mix(in srgb, ${color} calc(var(--inner-alpha) * 100%), transparent)`
}

function gutterBackground(color: string): string {
  return `color-mix(in srgb, ${color} calc(88% + var(--inner-alpha) * 12%), transparent)`
}

function editorChrome(theme: ColorTheme): Extension {
  return EditorView.theme(
    {
      '&': { height: '100%', backgroundColor: seeThrough(theme.background), color: theme.foreground, '--caret-color': theme.cursor },
      '.cm-scroller': { fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '22px' },
      '.cm-content': { caretColor: theme.cursor, padding: '8px 0' },
      '.cm-cursor': { borderLeftColor: 'var(--caret-color)' },
      '.cm-gutters': {
        backgroundColor: gutterBackground(theme.background),
        backdropFilter: 'blur(12px)',
        color: theme.code.comment,
        border: 'none',
        borderRight: '1px solid color-mix(in srgb, var(--color-strong) 8%, transparent)',
        marginRight: '4px'
      },
      '.cm-activeLine': { backgroundColor: 'color-mix(in srgb, var(--color-strong) 4%, transparent)' },
      '.cm-activeLineGutter': { backgroundColor: 'transparent', color: theme.foreground, fontWeight: '700' },
      '.cm-selectionLayer .cm-selectionBackground, &.cm-focused > .cm-scroller > .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection': {
        backgroundColor: theme.selection
      },
      '.cm-matchingBracket': { backgroundColor: theme.selection, outline: '1px solid var(--color-faint)' },
      '&.cm-focused': { outline: 'none' }
    },
    { dark: isDarkTheme(theme) }
  )
}

function codeHighlighting(theme: ColorTheme): Extension {
  return syntaxHighlighting(codeHighlightStyle(theme))
}

export function colorThemeExtension(theme: ColorTheme): Extension {
  return [editorChrome(theme), codeHighlighting(theme), indentGuides(theme)]
}

export const editorLayoutTheme = EditorView.theme(
  {
    '.cm-tooltip': {
      backgroundColor: 'var(--color-popover)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
      borderRadius: 'var(--radius)',
      overflow: 'hidden'
    },
    '.cm-diagnostic': { padding: '6px 10px', marginLeft: '0', borderLeft: 'none', lineHeight: '1.5' },
    '.cm-diagnosticSource': { marginTop: '4px', fontSize: '11px', color: 'var(--color-muted)', opacity: '1' },
    '.cm-tooltip-lint': { maxWidth: '560px' },
    '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', fontSize: '12px', maxHeight: '240px' },
    '.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px', lineHeight: '20px' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--color-selected)',
      color: 'var(--color-strong)'
    },
    '.cm-completionMatchedText': { textDecoration: 'none', fontWeight: '700', color: 'var(--color-strong)' },
    '.cm-completionDetail': { color: 'var(--color-muted)', marginLeft: '12px', fontStyle: 'normal' },
    '.cm-completionInfo': { padding: '6px 10px', color: 'var(--color-muted)' },
    '.cm-completionIcon-folder:after': { content: "'dir'", fontSize: '50%', verticalAlign: 'middle' },
    '.cm-completionIcon-file:after': { content: "'file'", fontSize: '50%', verticalAlign: 'middle' },
    '.cm-snippetField': { backgroundColor: 'var(--color-selected)', outline: '1px solid var(--color-faint)' }
  }
)
