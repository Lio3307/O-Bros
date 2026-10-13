import { comparablePath, isPathInside } from './paths'

export type NewRootKind = 'new' | 'same' | 'inside'

export interface NewRootClassification {
  kind: NewRootKind
  matchedRootPath: string | null
}

export function classifyNewRoot(chosenPath: string, existingRoots: string[], ignoreCase: boolean): NewRootClassification {
  const chosen = comparablePath(chosenPath, ignoreCase)

  for (const rootPath of existingRoots) {
    if (comparablePath(rootPath, ignoreCase) === chosen) {
      return { kind: 'same', matchedRootPath: rootPath }
    }
  }
  for (const rootPath of existingRoots) {
    if (isPathInside(chosen, comparablePath(rootPath, ignoreCase))) {
      return { kind: 'inside', matchedRootPath: rootPath }
    }
  }
  return { kind: 'new', matchedRootPath: null }
}
