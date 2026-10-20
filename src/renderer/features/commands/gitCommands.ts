import { useChangesStore } from '../../state/changesStore'
import { useLayoutStore } from '../../state/layoutStore'
import { gitRepositoryPath } from '../../state/gitRepositoryStore'
import { useStashStore } from '../../state/stashStore'
import { toast } from '../../state/toastStore'
import { createBranchFlow } from '../changes/branchFlows'
import type { AppCommand } from './commandTypes'

function withRepository(action: (repoPath: string) => void | Promise<unknown>): () => void | Promise<unknown> {
  return () => {
    const repoPath = gitRepositoryPath()
    if (repoPath === null) {
      toast.warning('Open a folder in Projects first.')
      return undefined
    }
    return action(repoPath)
  }
}

function showChangesView(view: 'diff' | 'graph'): void {
  useChangesStore.getState().setView(view)
  useLayoutStore.getState().openSection('changes')
}

export const GIT_COMMANDS: AppCommand[] = [
  {
    id: 'git.graph',
    title: 'Show the commit graph',
    group: 'Git',
    keywords: ['history', 'branches', 'log'],
    run: () => showChangesView('graph')
  },
  {
    id: 'git.changes',
    title: 'Show the changed files',
    group: 'Git',
    keywords: ['diff', 'status'],
    run: () => showChangesView('diff')
  },
  {
    id: 'git.fetch',
    title: 'Fetch from the remote',
    group: 'Git',
    run: withRepository((repoPath) => useChangesStore.getState().fetchRemote(repoPath))
  },
  {
    id: 'git.pull',
    title: 'Pull (fast-forward only)',
    group: 'Git',
    keywords: ['update', 'download'],
    run: withRepository((repoPath) => useChangesStore.getState().pull(repoPath))
  },
  {
    id: 'git.push',
    title: 'Push the current branch',
    group: 'Git',
    keywords: ['publish', 'upload'],
    run: withRepository((repoPath) => useChangesStore.getState().push(repoPath))
  },
  {
    id: 'git.stash',
    title: 'Stash the current changes',
    group: 'Git',
    keywords: ['shelve', 'set aside'],
    run: withRepository((repoPath) => useStashStore.getState().stash(repoPath, ''))
  },
  {
    id: 'git.newBranch',
    title: 'Create a new branch',
    group: 'Git',
    run: withRepository((repoPath) => createBranchFlow(repoPath))
  }
]
