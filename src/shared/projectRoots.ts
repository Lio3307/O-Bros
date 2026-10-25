import { comparablePath } from './paths'

export type NewRootKind = 'new' | 'same'

export interface NewRootClassification {
  kind: NewRootKind
  matchedRootPath: string | null
}

export function classifyNewRoot(chosenPath: string, existingRoots: string[], ignoreCase: boolean): NewRootClassification {
  const chosen = comparablePath(chosenPath, ignoreCase)
  const matchedRootPath = existingRoots.find((rootPath) => comparablePath(rootPath, ignoreCase) === chosen) ?? null
  return matchedRootPath === null ? { kind: 'new', matchedRootPath: null } : { kind: 'same', matchedRootPath }
}
