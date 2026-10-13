import { HighlightStyle, syntaxHighlighting } from '@codemirror/language'
import { EditorView } from '@codemirror/view'
import { tags } from '@lezer/highlight'

const CODE_COLORS = {
  keyword: '#CF8E6D',
  string: '#6AAB73',
  number: '#2AACB8',
  comment: '#7A7E85',
  functionName: '#56A8F5',
  typeName: '#E8BF6A',
  property: '#C77DBB',
  htmlTag: '#E8BF6A',
  attribute: '#BCBEC4',
  punctuation: '#8C8C8C',
  link: '#56A8F5'
}

export const editorTheme = EditorView.theme(
  {
    '&': { height: '100%', backgroundColor: 'var(--color-terminal)', color: 'var(--color-text)' },
    '.cm-scroller': { fontFamily: 'var(--font-mono)', fontSize: '13px', lineHeight: '22px' },
    '.cm-content': { caretColor: 'var(--color-white)', padding: '8px 0' },
    '.cm-cursor': { borderLeftColor: 'var(--color-white)' },
    '.cm-gutters': {
      backgroundColor: 'var(--color-terminal)',
      color: 'var(--color-muted)',
      border: 'none',
      paddingRight: '8px'
    },
    '.cm-activeLine': { backgroundColor: 'var(--color-hover)' },
    '.cm-activeLineGutter': { backgroundColor: 'transparent', color: 'var(--color-white)', fontWeight: '700' },
    '.cm-selectionBackground, &.cm-focused .cm-selectionBackground': { backgroundColor: 'var(--color-selected)' },
    '.cm-matchingBracket': { backgroundColor: 'var(--color-selected)', outline: '1px solid var(--color-faint)' },
    '&.cm-focused': { outline: 'none' },

    '.cm-tooltip': {
      backgroundColor: 'var(--color-panel)',
      color: 'var(--color-text)',
      border: '1px solid var(--color-border)',
      borderRadius: '6px',
      overflow: 'hidden'
    },
    '.cm-tooltip-autocomplete > ul': { fontFamily: 'var(--font-mono)', fontSize: '12px', maxHeight: '240px' },
    '.cm-tooltip-autocomplete > ul > li': { padding: '3px 10px', lineHeight: '20px' },
    '.cm-tooltip-autocomplete > ul > li[aria-selected]': {
      backgroundColor: 'var(--color-selected)',
      color: 'var(--color-white)'
    },
    '.cm-completionMatchedText': { textDecoration: 'none', fontWeight: '700', color: 'var(--color-white)' },
    '.cm-completionDetail': { color: 'var(--color-muted)', marginLeft: '12px', fontStyle: 'normal' },
    '.cm-completionInfo': { padding: '6px 10px', color: 'var(--color-muted)' },
    '.cm-snippetField': { backgroundColor: 'var(--color-selected)', outline: '1px solid var(--color-faint)' }
  },
  { dark: true }
)

export const codeHighlighting = syntaxHighlighting(
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
      color: CODE_COLORS.keyword
    },
    { tag: [tags.string, tags.special(tags.string), tags.regexp], color: CODE_COLORS.string },
    { tag: [tags.number, tags.bool, tags.null, tags.atom], color: CODE_COLORS.number },
    { tag: [tags.comment, tags.lineComment, tags.blockComment], color: CODE_COLORS.comment, fontStyle: 'italic' },
    {
      tag: [tags.function(tags.variableName), tags.function(tags.propertyName), tags.definition(tags.function(tags.variableName))],
      color: CODE_COLORS.functionName
    },
    { tag: [tags.typeName, tags.className, tags.namespace], color: CODE_COLORS.typeName },
    { tag: [tags.propertyName, tags.definition(tags.propertyName)], color: CODE_COLORS.property },
    { tag: [tags.tagName], color: CODE_COLORS.htmlTag },
    { tag: [tags.attributeName], color: CODE_COLORS.attribute },
    { tag: [tags.attributeValue], color: CODE_COLORS.string },
    { tag: [tags.angleBracket, tags.punctuation, tags.bracket, tags.separator], color: CODE_COLORS.punctuation },
    { tag: [tags.heading], color: CODE_COLORS.functionName, fontWeight: '700' },
    { tag: [tags.link, tags.url], color: CODE_COLORS.link, textDecoration: 'underline' },
    { tag: [tags.strong], fontWeight: '700' },
    { tag: [tags.emphasis], fontStyle: 'italic' }
  ])
)
