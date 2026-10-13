import type { EditorState } from '@codemirror/state'
import { useProblemsStore } from '../../state/problemsStore'

const savedStates = new Map<string, EditorState>()

export function getSavedEditorState(filePath: string): EditorState | undefined {
  return savedStates.get(filePath)
}

export function saveEditorState(filePath: string, state: EditorState): void {
  savedStates.set(filePath, state)
}

export function forgetEditorState(filePath: string): void {
  savedStates.delete(filePath)
  useProblemsStore.getState().clearFile(filePath)
}
