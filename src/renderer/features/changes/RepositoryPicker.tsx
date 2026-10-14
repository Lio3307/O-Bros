import { Folder, GitBranch } from 'lucide-react'
import { useEffect, useState } from 'react'
import type { RepositoryEntry } from '../../../shared/types'
import { useProjectsStore } from '../../state/projectsStore'
import { useRepositoryOriginStore } from '../../state/repositoryOriginStore'

export function RepositoryPicker({ folderPath }: { folderPath: string }) {
  const selectProject = useProjectsStore((state) => state.selectProject)
  const setOrigin = useRepositoryOriginStore((state) => state.setOrigin)
  const [repositories, setRepositories] = useState<RepositoryEntry[] | null>(null)

  useEffect(() => {
    let isCurrent = true
    setRepositories(null)
    window.api.projects
      .repositories(folderPath)
      .then((found) => isCurrent && setRepositories(found))
      .catch(() => isCurrent && setRepositories([]))
    return () => {
      isCurrent = false
    }
  }, [folderPath])

  function open(repository: RepositoryEntry): void {
    setOrigin(folderPath)
    selectProject(repository.path)
  }

  if (repositories === null) {
    return <p className="panel-empty">Looking for repositories…</p>
  }
  if (repositories.length === 0) {
    return null
  }

  return (
    <section>
      <h3 className="section-label">Repositories in this folder</h3>
      {repositories.map((repository) => (
        <button
          key={repository.path}
          type="button"
          className="row"
          title={repository.path}
          onClick={() => open(repository)}
        >
          <Folder size={14} />
          <span className="row-name">{repository.relativePath}</span>
          <span className="branch-label">
            <GitBranch size={12} />
            {repository.branch}
          </span>
        </button>
      ))}
    </section>
  )
}
