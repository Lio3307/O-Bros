import { Info } from 'lucide-react'
import { useEffect, useState } from 'react'
import { MAX_REPOSITORIES_FOUND } from '../../../shared/repositorySearch'
import { useLayoutStore } from '../../state/layoutStore'
import { Button } from '../../ui/Button'

function openRepositorySearchSetting(): void {
  const layout = useLayoutStore.getState()
  layout.selectSettingsPage('folders')
  layout.openSection('settings')
}

function levelsText(depth: number): string {
  return depth === 1 ? '1 folder level' : `${depth} folder levels`
}

export function SearchDepthNote({ foundCount }: { foundCount: number }) {
  const [depth, setDepth] = useState<number | null>(null)

  useEffect(() => {
    window.api.projects
      .searchDepth()
      .then(setDepth)
      .catch(() => setDepth(null))
  }, [])

  if (depth === null) {
    return null
  }
  const isCut = foundCount >= MAX_REPOSITORIES_FOUND
  return (
    <div className="search-depth-note">
      <Info size={14} />
      <span className="muted">
        {isCut
          ? `The search stopped after ${MAX_REPOSITORIES_FOUND} repositories, so some may be missing. Open a folder above to look inside it.`
          : `Only folders that hold a git repository are listed, looking up to ${levelsText(depth)} down. Folders without one, or with one deeper than that, are left out.`}
      </span>
      <Button variant="link" onClick={openRepositorySearchSetting}>
        Change how deep to look
      </Button>
    </div>
  )
}
