import { Compartment, type Extension } from '@codemirror/state'
import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'
import type { ColorTheme } from '../../theme/colorThemes'
import { isDarkTheme } from '../../theme/themeDerivation'

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
      '&': { height: '100%', backgroundColor: seeThrough(theme.background), color: theme.foreground },
      '.cm-scroller': { fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '22px' },
      '.cm-content': { caretColor: theme.cursor, padding: '8px 0' },
      '.cm-cursor': { borderLeftColor: theme.cursor },
      '.cm-gutters': {
        backgroundColor: gutterBackground(theme.background),
        backdropFilter: 'blur(12px)',
        color: theme.code.comment,
        border: 'none',
        paddingRight: '4px'
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
  const colors = theme.code
  return syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: [
          tags.keyword,
          tags.controlKeyword,
          tags.definitionKeyword,
          tags.moduleKeyword,
          tags.operatorKeyword,
          tags.modifier
        ],
        color: colors.keyword
      },
      { tag: [tags.string, tags.special(tags.string), tags.regexp], color: colors.string },
      { tag: [tags.number, tags.bool, tags.null, tags.atom], color: colors.number },
      { tag: [tags.comment, tags.lineComment, tags.blockComment], color: colors.comment, fontStyle: 'italic' },
      {
        tag: [
          tags.function(tags.variableName),
          tags.function(tags.propertyName),
          tags.definition(tags.function(tags.variableName))
        ],
        color: colors.functionName
      },
      { tag: [tags.typeName, tags.className, tags.namespace], color: colors.typeName },
      { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: colors.property },
      { tag: [tags.special(tags.variableName), tags.processingInstruction], color: colors.variable },
      { tag: [tags.operator], color: colors.punctuation },
      { tag: [tags.tagName], color: colors.htmlTag },
      { tag: [tags.attributeName], color: colors.attribute },
      { tag: [tags.attributeValue], color: colors.string },
      { tag: [tags.angleBracket, tags.punctuation, tags.bracket, tags.separator], color: colors.punctuation },
      { tag: [tags.heading], color: colors.functionName, fontWeight: '700' },
      { tag: [tags.link, tags.url], color: colors.link, textDecoration: 'underline' },
      { tag: [tags.strong], fontWeight: '700' },
      { tag: [tags.emphasis], fontStyle: 'italic' }
    ])
  )
}

export function colorThemeExtension(theme: ColorTheme): Extension {
  return [editorChrome(theme), codeHighlighting(theme)]
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
    '.cm-snippetField': { backgroundColor: 'var(--color-selected)', outline: '1px solid var(--color-faint)' }
  }
)
