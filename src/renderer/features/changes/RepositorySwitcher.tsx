import { FolderGit2 } from 'lucide-react'
import { useCallback, useEffect } from 'react'
import type { ComboboxOption } from '../../../shared/comboboxFilter'
import { lastPathSegment } from '../../../shared/paths'
import type { ProjectRoot } from '../../../shared/types'
import { useGitRepositoryStore } from '../../state/gitRepositoryStore'
import { useProjectsStore } from '../../state/projectsStore'
import { Combobox } from '../../ui/Combobox'
import { useLiveRefresh } from '../../ui/useLiveRefresh'
import { parentFolderHint, repositoriesIn, rescanRepositories } from './repositoryScan'

const FOLLOW_PROJECT = 'follow-project'
const REPOSITORY_PROJECTS_GROUP = 'Projects'

function foldersToScan(roots: ProjectRoot[]): string[] {
  return roots.filter((root) => root.branch === null).map((root) => root.path)
}

async function optionsOfFolder(root: ProjectRoot): Promise<ComboboxOption[]> {
  const repositories = await repositoriesIn(root.path)
  return [
    { value: root.path, label: 'Folder overview', group: root.name },
    ...repositories.map((repository) => ({ value: repository.path, label: repository.name, hint: parentFolderHint(repository), group: root.name }))
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

  useLiveRefresh(
    useCallback(async () => rescanRepositories(foldersToScan(roots)), [roots]),
    null
  )

  async function loadOptions(): Promise<ComboboxOption[]> {
    const followOption: ComboboxOption = {
      value: FOLLOW_PROJECT,
      label: 'Follow selected project',
      hint: activeProjectPath === null ? undefined : lastPathSegment(activeProjectPath)
    }
    const repositoryProjects = roots
      .filter((root) => root.branch !== null)
      .map((root) => ({ value: root.path, label: root.name, hint: root.branch ?? undefined, group: REPOSITORY_PROJECTS_GROUP }))
    const folders = await Promise.all(roots.filter((root) => root.branch === null).map(optionsOfFolder))
    return [followOption, ...repositoryProjects, ...folders.flat()]
  }

  function change(value: string): void {
    if (value === FOLLOW_PROJECT) {
      followProject()
    } else {
      open(value, null)
    }
  }

  return (
    <Combobox
      className="repository-switch"
      title={pinnedPath === null ? `${repoPath} (follows the selected project)` : repoPath}
      icon={<FolderGit2 size={14} />}
      label={lastPathSegment(repoPath)}
      triggerHint={pinnedPath === null ? 'following' : undefined}
      value={pinnedPath ?? FOLLOW_PROJECT}
      searchPlaceholder="Find a repository or folder"
      noMatchText="No repository or folder matches that."
      loadOptions={loadOptions}
      onChange={change}
    />
  )
}
