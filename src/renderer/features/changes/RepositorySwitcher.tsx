import { FolderGit2 } from 'lucide-react'
import { lastPathSegment } from '../../../shared/paths'
import type { ProjectRoot } from '../../../shared/types'
import { useGitRepositoryStore } from '../../state/gitRepositoryStore'
import { useProjectsStore } from '../../state/projectsStore'
import { Dropdown, type DropdownOption } from '../../ui/Dropdown'

const FOLLOW_PROJECT = 'follow-project'

async function repositoryOptionsOf(root: ProjectRoot): Promise<DropdownOption[]> {
  if (root.branch !== null) {
    return [{ value: root.path, label: root.name, hint: root.branch }]
  }
  const repositories = await window.api.projects.repositories(root.path).catch(() => [])
  return repositories.map((repository) => ({
    value: repository.path,
    label: repository.name,
    hint: `${root.name}/${repository.relativePath}`
  }))
}

export function RepositorySwitcher({ repoPath }: { repoPath: string }) {
  const roots = useProjectsStore((state) => state.roots)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const pinnedPath = useGitRepositoryStore((state) => state.pinnedPath)
  const open = useGitRepositoryStore((state) => state.open)
  const followProject = useGitRepositoryStore((state) => state.followProject)

  async function loadOptions(): Promise<DropdownOption[]> {
    const followOption: DropdownOption = {
      value: FOLLOW_PROJECT,
      label: 'Follow project',
      hint: activeProjectPath === null ? undefined : lastPathSegment(activeProjectPath)
    }
    const repositoryOptions = (await Promise.all(roots.map(repositoryOptionsOf))).flat()
    return [followOption, ...repositoryOptions]
  }

  function change(value: string): void {
    if (value === FOLLOW_PROJECT) {
      followProject()
    } else {
      open(value, null)
    }
  }

  return (
    <Dropdown
      className="repository-switch"
      title={pinnedPath === null ? `${repoPath} (follows the selected project)` : repoPath}
      icon={<FolderGit2 size={14} />}
      label={lastPathSegment(repoPath)}
      value={pinnedPath ?? FOLLOW_PROJECT}
      loadOptions={loadOptions}
      onChange={change}
    />
  )
}
