import { isPathInside } from '../../shared/paths'
import { useProjectsStore } from './projectsStore'

export function useIsInMissingProject(path: string | null): boolean {
  return useProjectsStore((state) => path !== null && state.roots.some((root) => root.isMissing && isPathInside(path, root.path)))
}
