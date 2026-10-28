import type { Completion, CompletionContext, CompletionResult, CompletionSource } from '@codemirror/autocomplete'
import { syntaxTree } from '@codemirror/language'
import { LSPPlugin } from '@codemirror/lsp-client'
import { EditorState, type Extension, type Text } from '@codemirror/state'
import { lastPathSegment, parentPath, resolvePath } from '../../../shared/paths'
import { pathQueryOf, wordBefore, wordsIn } from './completionText'
import { savedEditorStates } from './editorSessions'
import { completeJavascriptGlobals } from './javascriptGlobals'

const MAX_SCANNED_CHARACTERS = 400_000
const WORD_BOOST = -20
const STRING_NODE_PARTS = ['String', 'AttributeValue', 'URL']
const QUOTES = ['"', "'", '`']

const wordsByDocument = new WeakMap<Text, string[]>()

function wordsOf(document: Text): string[] {
  const cached = wordsByDocument.get(document)
  if (cached !== undefined) {
    return cached
  }
  const words = wordsIn(document.sliceString(0, MAX_SCANNED_CHARACTERS))
  wordsByDocument.set(document, words)
  return words
}

function hasLanguageCompletion(context: CompletionContext, ownSources: CompletionSource[]): boolean {
  const sources = context.state.languageDataAt<CompletionSource>('autocomplete', context.pos)
  return sources.some((source) => !ownSources.includes(source))
}

function wordOptions(words: string[], typed: string, detail: string | undefined, seen: Set<string>): Completion[] {
  const options: Completion[] = []
  for (const word of words) {
    if (word !== typed && !seen.has(word)) {
      seen.add(word)
      options.push({ label: word, type: 'text', detail, boost: WORD_BOOST })
    }
  }
  return options
}

function textInStringBeforeCursor(context: CompletionContext): string | null {
  const node = syntaxTree(context.state).resolveInner(context.pos, -1)
  if (!STRING_NODE_PARTS.some((part) => node.name.includes(part))) {
    return null
  }
  const text = context.state.sliceDoc(node.from, context.pos)
  return QUOTES.includes(text[0]) ? text.slice(1) : text
}

function isTypingPath(context: CompletionContext): boolean {
  const text = textInStringBeforeCursor(context)
  return text !== null && pathQueryOf(text) !== null
}

function openFileWords(filePath: string, ownSources: CompletionSource[]): CompletionSource {
  return (context) => {
    const line = context.state.doc.lineAt(context.pos)
    const typed = wordBefore(line.text.slice(0, context.pos - line.from))
    const isAfterDot = line.text[context.pos - line.from - typed.length - 1] === '.'
    if ((typed === '' && !context.explicit) || isAfterDot || isTypingPath(context)) {
      return null
    }
    const seen = new Set<string>()
    const options = hasLanguageCompletion(context, ownSources) ? [] : wordOptions(wordsOf(context.state.doc), typed, undefined, seen)
    for (const [otherPath, state] of savedEditorStates()) {
      if (otherPath !== filePath) {
        options.push(...wordOptions(wordsOf(state.doc), typed, lastPathSegment(otherPath), seen))
      }
    }
    return options.length === 0 ? null : { from: context.pos - typed.length, options }
  }
}

function hasLanguageServer(context: CompletionContext): boolean {
  return context.view !== undefined && LSPPlugin.get(context.view) !== null
}

function javascriptGlobals(): CompletionSource {
  return (context) => (hasLanguageServer(context) ? null : completeJavascriptGlobals(context))
}

function filePaths(filePath: string): CompletionSource {
  return async (context): Promise<CompletionResult | null> => {
    if (hasLanguageServer(context)) {
      return null
    }
    const text = textInStringBeforeCursor(context)
    const query = text === null ? null : pathQueryOf(text)
    if (query === null) {
      return null
    }
    const folder = resolvePath(parentPath(filePath), query.folderPart)
    const entries = await window.api.files.list(folder).catch(() => null)
    if (entries === null) {
      return null
    }
    return {
      from: context.pos - query.namePart.length,
      options: entries.map((entry) => ({
        label: entry.isDirectory ? `${entry.name}/` : entry.name,
        type: entry.isDirectory ? 'folder' : 'file',
        detail: entry.isDirectory ? 'folder' : undefined
      })),
      validFor: (typed) => !typed.includes('/')
    }
  }
}

export function smartCompletion(filePath: string): Extension {
  const ownSources: CompletionSource[] = []
  ownSources.push(openFileWords(filePath, ownSources), filePaths(filePath), javascriptGlobals())
  return EditorState.languageData.of(() => ownSources.map((source) => ({ autocomplete: source })))
}
