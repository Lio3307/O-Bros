import { isPathInside } from './paths'
import type { ProjectRoot } from './types'

export interface ProjectLocation {
  name: string
  path: string
}

export function closestProject(location: string, roots: ProjectRoot[]): ProjectLocation | null {
  let closest: ProjectLocation | null = null
  for (const root of roots) {
    for (const candidate of [root, ...root.folders]) {
      const isDeeper = closest === null || candidate.path.length > closest.path.length
      if (isDeeper && isPathInside(location, candidate.path)) {
        closest = { name: candidate.name, path: candidate.path }
      }
    }
  }
  return closest
}
