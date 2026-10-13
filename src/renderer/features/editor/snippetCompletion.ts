import { snippetCompletion, type CompletionContext, type CompletionResult } from '@codemirror/autocomplete'
import { EditorState, type Extension } from '@codemirror/state'
import { useEditorSettingsStore } from '../../state/editorSettingsStore'
import type { LanguageId } from './languageRegistry'

function snippetSourceFor(languageId: LanguageId) {
  return (context: CompletionContext): CompletionResult | null => {
    const snippets = useEditorSettingsStore.getState().snippets[languageId].filter((snippet) => snippet.prefix !== '')
    const word = context.state.wordAt(context.pos)
    if (snippets.length === 0 || (word === null && !context.explicit)) {
      return null
    }
    return {
      from: word?.from ?? context.pos,
      options: snippets.map((snippet) =>
        snippetCompletion(snippet.body, { label: snippet.prefix, detail: snippet.description, type: 'snippet' })
      )
    }
  }
}

export function snippetCompletionFor(languageId: LanguageId): Extension {
  const source = snippetSourceFor(languageId)
  return EditorState.languageData.of(() => [{ autocomplete: source }])
}
