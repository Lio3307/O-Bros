import type { SearchHit } from '../../../shared/types'

export interface MergedHit {
  hit: SearchHit
  isContentOnly: boolean
}

export function mergeSearchHits(nameHits: SearchHit[], contentHits: SearchHit[]): MergedHit[] {
  const namePaths = new Set(nameHits.map((hit) => hit.path))
  const nameResults = nameHits.map((hit) => ({ hit, isContentOnly: false }))
  const contentResults = contentHits
    .filter((hit) => !namePaths.has(hit.path))
    .map((hit) => ({ hit, isContentOnly: true }))
  return [...nameResults, ...contentResults]
}
