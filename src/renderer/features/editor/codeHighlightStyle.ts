import { HighlightStyle } from '@codemirror/language'
import { tags } from '@lezer/highlight'
import type { ColorTheme } from '../../theme/colorThemes'

const ANSI_RED = 1
const ANSI_GREEN = 2
const ANSI_YELLOW = 3

export function codeHighlightStyle(theme: ColorTheme): HighlightStyle {
  const colors = theme.code
  return HighlightStyle.define([
    { tag: [tags.name, tags.literal, tags.content, tags.list], color: theme.foreground },
    { tag: [tags.keyword, tags.modifier, tags.self, tags.meta, tags.annotation], color: colors.keyword },
    { tag: [tags.string, tags.special(tags.string), tags.regexp, tags.attributeValue, tags.quote, tags.monospace], color: colors.string },
    { tag: tags.escape, color: colors.variable },
    { tag: [tags.number, tags.bool, tags.null, tags.atom, tags.unit, tags.color, tags.constant(tags.name)], color: colors.number },
    { tag: tags.comment, color: colors.comment, fontStyle: 'italic' },
    { tag: [tags.function(tags.name), tags.macroName], color: colors.functionName },
    { tag: [tags.typeName, tags.className, tags.namespace], color: colors.typeName },
    { tag: tags.tagName, color: colors.htmlTag },
    { tag: tags.propertyName, color: colors.property },
    { tag: tags.attributeName, color: colors.attribute },
    { tag: [tags.special(tags.name), tags.standard(tags.name), tags.labelName, tags.processingInstruction], color: colors.variable },
    { tag: [tags.operator, tags.punctuation], color: colors.punctuation },
    { tag: tags.heading, color: colors.functionName, fontWeight: '700' },
    { tag: [tags.link, tags.url], color: colors.link, textDecoration: 'underline' },
    { tag: tags.strong, fontWeight: '700' },
    { tag: tags.emphasis, fontStyle: 'italic' },
    { tag: tags.strikethrough, textDecoration: 'line-through' },
    { tag: tags.inserted, color: theme.ansi[ANSI_GREEN] },
    { tag: tags.deleted, color: theme.ansi[ANSI_RED] },
    { tag: tags.changed, color: theme.ansi[ANSI_YELLOW] },
    { tag: tags.invalid, color: theme.ansi[ANSI_RED] }
  ])
}
