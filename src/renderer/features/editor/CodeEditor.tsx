import type { Extension } from '@codemirror/state'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { lastPathSegment } from '../../../shared/paths'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { basicSetup } from 'codemirror'
import { useEffect, useRef, useState } from 'react'
import { isLanguageEnabled, useEditorSettingsStore } from '../../state/editorSettingsStore'
import { useEditorNavigationStore } from '../../state/editorNavigationStore'
import { toast } from '../../state/toastStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { PopupMenu } from '../../ui/PopupMenu'
import { autoSaveExtension } from './autoSaveExtension'
import { useEditorContextMenuStore } from './editorContextMenuStore'
import { hasSelection, sendEditorContentToAgent } from './sendFromEditor'
import { getSavedEditorState, saveEditorState } from './editorSessions'
import { codeHighlighting, editorTheme } from './editorTheme'
import { formatDocument } from './formatDocument'
import { findLanguageForFile, type LanguageDefinition } from './languageRegistry'
import { lintExtensionFor, lintNow } from './lintExtension'
import { snippetCompletionFor } from './snippetCompletion'
import './editor.css'

interface CodeEditorProps {
  tabId: string
  filePath: string
}

function enabledLanguageFor(filePath: string): LanguageDefinition | null {
  const language = findLanguageForFile(filePath)
  const settings = useEditorSettingsStore.getState()
  return language !== null && isLanguageEnabled(settings, language.id) ? language : null
}

async function languageExtensionsFor(filePath: string, language: LanguageDefinition | null): Promise<Extension[]> {
  if (language === null) {
    return []
  }
  const extensions: Extension[] = [await language.load(), snippetCompletionFor(language.id)]
  if (language.canLint) {
    extensions.push(lintExtensionFor(filePath))
  }
  return extensions
}

async function formatWithNotice(view: EditorView, filePath: string, language: LanguageDefinition | null): Promise<void> {
  if (language === null || !language.canFormat) {
    toast.warning('Formatting is not available for this file type.')
    return
  }
  const outcome = await formatDocument(view, filePath)
  if (outcome.kind === 'failed') {
    toast.error('Could not format this file. It may contain a syntax error.')
  }
}

async function saveFile(
  view: EditorView,
  tabId: string,
  filePath: string,
  language: LanguageDefinition | null,
  isAutomatic: boolean
): Promise<void> {
  const wantsFormat = useEditorSettingsStore.getState().formatOnSave && language !== null && language.canFormat
  if (wantsFormat && !isAutomatic) {
    await formatWithNotice(view, filePath, language)
  }
  try {
    await window.api.files.write(filePath, view.state.doc.toString())
    useWorkspaceStore.getState().setFileModified(tabId, false)
    if (!isAutomatic) {
      toast.success('Saved ' + lastPathSegment(filePath) + '.')
    }
    if (language !== null && language.canLint) {
      lintNow(view)
    }
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not save this file.'))
  }
}

async function buildEditorState(tabId: string, filePath: string): Promise<EditorState> {
  const language = enabledLanguageFor(filePath)
  const [content, languageExtensions] = await Promise.all([
    window.api.files.read(filePath),
    languageExtensionsFor(filePath, language)
  ])

  const fileShortcuts = keymap.of([
    {
      key: 'Mod-s',
      run: (view) => {
        void saveFile(view, tabId, filePath, language, false)
        return true
      }
    },
    {
      key: 'Shift-Alt-f',
      run: (view) => {
        void formatWithNotice(view, filePath, language)
        return true
      }
    },
    {
      key: 'Mod-Shift-Enter',
      run: (view) => {
        sendEditorContentToAgent(view, filePath, false)
        return true
      }
    }
  ])

  const contextMenu = EditorView.domEventHandlers({
    contextmenu: (event, view) => {
      event.preventDefault()
      const items = [
        {
          label: hasSelection(view) ? 'Send selection to terminal…' : 'Send file to terminal…',
          hint: 'Ctrl+Shift+Enter',
          onSelect: () => sendEditorContentToAgent(view, filePath, false)
        },
        ...(hasSelection(view)
          ? [{ label: 'Send whole file to terminal…', onSelect: () => sendEditorContentToAgent(view, filePath, true) }]
          : [])
      ]
      useEditorContextMenuStore.getState().open({ x: event.clientX, y: event.clientY, items })
      return true
    }
  })

  const reportModification = EditorView.updateListener.of((update) => {
    if (update.docChanged) {
      useWorkspaceStore.getState().setFileModified(tabId, true)
    }
  })

  const autoSave = autoSaveExtension((view) => void saveFile(view, tabId, filePath, language, true))

  return EditorState.create({
    doc: content,
    extensions: [
      basicSetup,
      editorTheme,
      codeHighlighting,
      fileShortcuts,
      contextMenu,
      reportModification,
      autoSave,
      ...languageExtensions
    ]
  })
}

function revealPendingTarget(view: EditorView, filePath: string): void {
  const { target, consume } = useEditorNavigationStore.getState()
  if (target === null || target.path !== filePath) {
    return
  }
  const line = view.state.doc.line(Math.min(Math.max(target.line, 1), view.state.doc.lines))
  const position = Math.min(line.from + Math.max(target.column - 1, 0), line.to)
  view.dispatch({ selection: { anchor: position }, scrollIntoView: true })
  view.focus()
  consume()
}

export function CodeEditor({ tabId, filePath }: CodeEditorProps) {
  const hostRef = useRef<HTMLDivElement>(null)
  const viewRef = useRef<EditorView | null>(null)
  const target = useEditorNavigationStore((state) => state.target)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const contextMenu = useEditorContextMenuStore((state) => state.menu)
  const closeContextMenu = useEditorContextMenuStore((state) => state.close)

  useEffect(() => {
    if (viewRef.current !== null) {
      revealPendingTarget(viewRef.current, filePath)
    }
  }, [target, filePath])

  useEffect(() => {
    let view: EditorView | null = null
    let isCancelled = false

    async function mountEditor(): Promise<void> {
      const state = getSavedEditorState(filePath) ?? (await buildEditorState(tabId, filePath))
      if (isCancelled || hostRef.current === null) {
        return
      }
      view = new EditorView({ state, parent: hostRef.current })
      viewRef.current = view
      revealPendingTarget(view, filePath)
      const language = enabledLanguageFor(filePath)
      if (language !== null && language.canLint) {
        lintNow(view)
      }
    }

    setErrorMessage(null)
    mountEditor().catch((error: unknown) => setErrorMessage(friendlyErrorMessage(error, 'Could not open this file.')))

    return () => {
      isCancelled = true
      viewRef.current = null
      if (view !== null) {
        saveEditorState(filePath, view.state)
        view.destroy()
      }
    }
  }, [tabId, filePath])

  if (errorMessage !== null) {
    return <div className="editor-error">{errorMessage}</div>
  }
  return (
    <>
      <div className="editor-host" ref={hostRef} />
      {contextMenu !== null && (
        <PopupMenu x={contextMenu.x} y={contextMenu.y} items={contextMenu.items} onClose={closeContextMenu} />
      )}
    </>
  )
}
