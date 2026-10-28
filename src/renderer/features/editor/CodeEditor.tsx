import type { Extension } from '@codemirror/state'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { lastPathSegment } from '../../../shared/paths'
import { EditorState } from '@codemirror/state'
import { EditorView, keymap } from '@codemirror/view'
import { useEffect, useRef, useState } from 'react'
import { isLanguageEnabled, useEditorSettingsStore } from '../../state/editorSettingsStore'
import { activeColorTheme, useActiveColorTheme } from '../../state/colorThemeStore'
import { useEditorNavigationStore } from '../../state/editorNavigationStore'
import { toast } from '../../state/toastStore'
import { useWorkspaceStore } from '../../state/workspaceStore'
import { Button } from '../../ui/Button'
import { Notice } from '../../ui/Notice'
import { LoadingText } from '../../ui/LoadingText'
import { autoSaveExtension } from './autoSaveExtension'
import { followDiskChanges, isFromDisk, showDiskText } from './diskSync'
import { selectAllOccurrences } from './selectAllOccurrences'
import { getSavedEditorState, saveEditorState } from './editorSessions'
import { colorThemeCompartment, colorThemeExtension, editorLayoutTheme } from './editorTheme'
import { editorMotionTheme } from './editorMotion'
import { formatDocument } from './formatDocument'
import { openDroppedFiles } from './openDroppedFiles'
import { editorSetup } from './editorSetup'
import { connectVimFileActions, vimCompartment, vimExtension } from './vimMode'
import { findLanguageForFile, type LanguageDefinition } from './languageRegistry'
import { lintExtensionFor, lintNow } from './lintExtension'
import {
  attachLanguageServer,
  detachLanguageServer,
  languageServerCompartment,
  prepareLanguageServer,
  type PreparedServer
} from './languageServer/languageServerSupport'
import './editor.css'

interface CodeEditorProps {
  tabId: string
  filePath: string
}

function currentColorThemeExtension(): Extension {
  return colorThemeExtension(activeColorTheme())
}

function enabledLanguageFor(filePath: string, firstLine: string): LanguageDefinition | null {
  const language = findLanguageForFile(filePath, firstLine)
  const settings = useEditorSettingsStore.getState()
  return language !== null && isLanguageEnabled(settings, language.id) ? language : null
}

async function languageExtensionsFor(filePath: string, language: LanguageDefinition | null): Promise<Extension[]> {
  if (language === null) {
    return []
  }
  const extensions: Extension[] = [await language.load()]
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
  const content = await window.api.files.read(filePath)
  const language = enabledLanguageFor(filePath, content.split('\n', 1)[0])
  const languageExtensions = await languageExtensionsFor(filePath, language)

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
      key: 'F2',
      run: selectAllOccurrences
    }
  ])

  const reportModification = EditorView.updateListener.of((update) => {
    if (update.docChanged && !isFromDisk(update)) {
      useWorkspaceStore.getState().setFileModified(tabId, true)
    }
  })

  const autoSave = autoSaveExtension((view) => void saveFile(view, tabId, filePath, language, true))

  return EditorState.create({
    doc: content,
    extensions: [
      vimCompartment.of(vimExtension(useEditorSettingsStore.getState().vimMode)),
      editorSetup,
      editorLayoutTheme,
      editorMotionTheme,
      colorThemeCompartment.of(currentColorThemeExtension()),
      fileShortcuts,
      openDroppedFiles,
      reportModification,
      autoSave,
      languageServerCompartment.of([]),
      ...languageExtensions
    ]
  })
}

function isFileModified(tabId: string): boolean {
  const tab = useWorkspaceStore.getState().tabs.find((candidate) => candidate.id === tabId)
  return tab?.kind === 'file' && tab.isModified
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
  const [isOpening, setIsOpening] = useState(true)
  const [diskText, setDiskText] = useState<string | null>(null)
  const colorTheme = useActiveColorTheme()
  const isVimMode = useEditorSettingsStore((state) => state.vimMode)

  function reloadFromDisk(): void {
    if (viewRef.current !== null && diskText !== null) {
      showDiskText(viewRef.current, diskText)
      useWorkspaceStore.getState().setFileModified(tabId, false)
    }
    setDiskText(null)
  }

  useEffect(() => {
    viewRef.current?.dispatch({ effects: colorThemeCompartment.reconfigure(currentColorThemeExtension()) })
  }, [colorTheme])

  useEffect(() => {
    viewRef.current?.dispatch({ effects: vimCompartment.reconfigure(vimExtension(isVimMode)) })
  }, [isVimMode])

  useEffect(() => {
    if (viewRef.current !== null) {
      revealPendingTarget(viewRef.current, filePath)
    }
  }, [target, filePath])

  useEffect(() => {
    let view: EditorView | null = null
    let isCancelled = false
    let server: PreparedServer | null = null
    let stopFollowingDisk: (() => void) | null = null

    async function checkDisk(mountedView: EditorView): Promise<void> {
      const text = await window.api.files.read(filePath).catch(() => null)
      if (text === null || isCancelled) {
        return
      }
      if (text === mountedView.state.doc.toString()) {
        setDiskText(null)
      } else if (isFileModified(tabId)) {
        setDiskText(text)
      } else {
        showDiskText(mountedView, text)
        setDiskText(null)
      }
    }

    async function connectLanguageServer(mountedView: EditorView, language: LanguageDefinition): Promise<void> {
      const prepared = await prepareLanguageServer(filePath, language.serverLanguageId ?? language.id)
      if (prepared === null) {
        return
      }
      if (isCancelled) {
        detachLanguageServer(null, prepared)
        return
      }
      server = prepared
      attachLanguageServer(mountedView, prepared)
    }

    async function mountEditor(): Promise<void> {
      const state = getSavedEditorState(filePath) ?? (await buildEditorState(tabId, filePath))
      if (isCancelled || hostRef.current === null) {
        return
      }
      view = new EditorView({ state, parent: hostRef.current })
      view.dispatch({
        effects: [
          colorThemeCompartment.reconfigure(currentColorThemeExtension()),
          vimCompartment.reconfigure(vimExtension(useEditorSettingsStore.getState().vimMode))
        ]
      })
      viewRef.current = view
      setIsOpening(false)
      const mountedView = view
      stopFollowingDisk = followDiskChanges(filePath, () => void checkDisk(mountedView))
      void checkDisk(mountedView)
      revealPendingTarget(view, filePath)
      const language = enabledLanguageFor(filePath, view.state.doc.line(1).text)
      connectVimFileActions(mountedView, {
        save: () => saveFile(mountedView, tabId, filePath, language, false),
        close: () => useWorkspaceStore.getState().closeTab(tabId),
        hasUnsavedChanges: () => isFileModified(tabId)
      })
      if (language !== null && language.canLint) {
        lintNow(view)
      }
      if (language !== null && language.isGenerated !== true) {
        void connectLanguageServer(view, language)
      }
    }

    setErrorMessage(null)
    setIsOpening(true)
    mountEditor().catch((error: unknown) => setErrorMessage(friendlyErrorMessage(error, 'Could not open this file.')))

    return () => {
      isCancelled = true
      viewRef.current = null
      stopFollowingDisk?.()
      if (server !== null) {
        detachLanguageServer(view, server)
      }
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
    <div className="editor-frame">
      {diskText !== null && (
        <Notice
          tone="warning"
          title="This file changed on disk."
          actions={
            <>
              <Button variant="primary" onClick={reloadFromDisk}>
                Reload
              </Button>
              <Button variant="outline" onClick={() => setDiskText(null)}>
                Keep mine
              </Button>
            </>
          }
        >
          You have unsaved changes. Reload shows the new version; Keep mine leaves your text, and saving writes over the file.
        </Notice>
      )}
      <div className="editor-host" ref={hostRef} />
      {isOpening && errorMessage === null && (
        <div className="loading-overlay">
          <LoadingText text={`Opening ${lastPathSegment(filePath)}…`} isDelayed />
        </div>
      )}
    </div>
  )
}
