import { isPathInside } from '../../../shared/paths'

export interface SessionPlacement<Session> {
  byFolderPath: Map<string, Session[]>
  atRoot: Session[]
}

function deepestFolderContaining(cwd: string, folderPaths: string[]): string | null {
  let deepest: string | null = null
  for (const folderPath of folderPaths) {
    const isDeeper = deepest === null || folderPath.length > deepest.length
    if (isDeeper && isPathInside(cwd, folderPath)) {
      deepest = folderPath
    }
  }
  return deepest
}

export function placeSessions<Session extends { cwd: string | null }>(
  sessions: Session[],
  rootPath: string,
  folderPaths: string[]
): SessionPlacement<Session> {
  const placement: SessionPlacement<Session> = { byFolderPath: new Map(), atRoot: [] }
  for (const session of sessions) {
    if (session.cwd === null || !isPathInside(session.cwd, rootPath)) {
      continue
    }
    const folderPath = deepestFolderContaining(session.cwd, folderPaths)
    if (folderPath === null) {
      placement.atRoot.push(session)
      continue
    }
    placement.byFolderPath.set(folderPath, [...(placement.byFolderPath.get(folderPath) ?? []), session])
  }
  return placement
}
