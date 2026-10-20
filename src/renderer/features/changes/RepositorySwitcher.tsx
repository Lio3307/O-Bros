import { FolderGit2 } from 'lucide-react'
import { useEffect } from 'react'
import { lastPathSegment } from '../../../shared/paths'
import type { ProjectRoot } from '../../../shared/types'
import { useGitRepositoryStore } from '../../state/gitRepositoryStore'
import { useProjectsStore } from '../../state/projectsStore'
import { Dropdown, type DropdownOption } from '../../ui/Dropdown'
import { repositoriesIn, rescanRepositories } from './repositoryScan'

const FOLLOW_PROJECT = 'follow-project'

function foldersToScan(roots: ProjectRoot[]): string[] {
  return roots.filter((root) => root.branch === null).map((root) => root.path)
}

async function optionsOfRoot(root: ProjectRoot): Promise<DropdownOption[]> {
  const rootOption: DropdownOption = {
    value: root.path,
    label: root.name,
    hint: root.branch ?? 'project folder',
    hasSeparatorBefore: true
  }
  if (root.branch !== null) {
    return [rootOption]
  }
  const repositories = await repositoriesIn(root.path)
  return [
    rootOption,
    ...repositories.map((repository) => ({ value: repository.path, label: repository.name, hint: repository.relativePath }))
  ]
}

export function RepositorySwitcher({ repoPath }: { repoPath: string }) {
  const roots = useProjectsStore((state) => state.roots)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const pinnedPath = useGitRepositoryStore((state) => state.pinnedPath)
  const open = useGitRepositoryStore((state) => state.open)
  const followProject = useGitRepositoryStore((state) => state.followProject)

  useEffect(() => {
    rescanRepositories(foldersToScan(roots))
  }, [roots])

  async function loadOptions(): Promise<DropdownOption[]> {
    const followOption: DropdownOption = {
      value: FOLLOW_PROJECT,
      label: 'Follow project',
      hint: activeProjectPath === null ? undefined : lastPathSegment(activeProjectPath)
    }
    const rootOptions = (await Promise.all(roots.map(optionsOfRoot))).flat()
    return [followOption, ...rootOptions]
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
