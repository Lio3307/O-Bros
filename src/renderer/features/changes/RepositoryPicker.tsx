import { ChevronRight, Folder, FolderGit2, GitBranch } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { resolvePath } from '../../../shared/paths'
import { groupRepositoriesByFolder } from '../../../shared/repositoryGroups'
import type { RepositoryEntry } from '../../../shared/types'
import { useGitRepositoryStore } from '../../state/gitRepositoryStore'
import { LoadingText } from '../../ui/LoadingText'
import { useLiveRefresh } from '../../ui/useLiveRefresh'
import { scanRepositories } from './repositoryScan'

function repositoryCountText(count: number): string {
  return count === 1 ? '1 repository' : `${count} repositories`
}

export function RepositoryPicker({ folderPath }: { folderPath: string }) {
  const openRepository = useGitRepositoryStore((state) => state.open)
  const [repositories, setRepositories] = useState<RepositoryEntry[] | null>(null)

  const shownFolder = useRef(folderPath)

  useEffect(() => {
    shownFolder.current = folderPath
    let isCurrent = true
    setRepositories(null)
    void scanRepositories(folderPath).then((found) => isCurrent && setRepositories(found))
    return () => {
      isCurrent = false
    }
  }, [folderPath])

  useLiveRefresh(
    useCallback(async () => {
      const found = await scanRepositories(folderPath)
      if (shownFolder.current === folderPath) {
        setRepositories(found)
      }
    }, [folderPath]),
    null
  )

  function open(path: string): void {
    openRepository(path, folderPath)
  }

  if (repositories === null) {
    return <p className="panel-empty"><LoadingText text="Looking for repositories…" /></p>
  }
  if (repositories.length === 0) {
    return <p className="muted">No repositories were found inside this folder.</p>
  }

  return (
    <section className="repository-list">
      <h3 className="repository-list-title">
        Repositories in this folder
        <span className="repository-list-count">{repositories.length}</span>
      </h3>
      {groupRepositoriesByFolder(repositories).map((item) => {
        if (item.kind === 'folder') {
          const path = resolvePath(folderPath, item.name)
          return (
            <button key={path} type="button" className="repository-row" title={`Open ${path}`} onClick={() => open(path)}>
              <Folder size={14} />
              <span className="repository-row-name">{item.name}</span>
              <span className="muted">{repositoryCountText(item.repositoryCount)}</span>
              <ChevronRight size={14} />
            </button>
          )
        }
        const { repository } = item
        return (
          <button
            key={repository.path}
            type="button"
            className="repository-row"
            title={`Open ${repository.path}`}
            onClick={() => open(repository.path)}
          >
            <FolderGit2 size={14} />
            <span className="repository-row-name">{repository.name}</span>
            <span className="branch-label">
              <GitBranch size={12} />
              {repository.branch}
            </span>
            <ChevronRight size={14} />
          </button>
        )
      })}
    </section>
  )
}
