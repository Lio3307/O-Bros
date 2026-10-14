import { friendlyErrorMessage } from '../../../shared/friendlyError'
import type { GitStatus } from '../../../shared/types'
import { useChangesStore } from '../../state/changesStore'
import { askToConfirm } from '../../state/confirmStore'
import { useProjectsStore } from '../../state/projectsStore'
import { askForText } from '../../state/textPromptStore'
import { toast } from '../../state/toastStore'

const NOT_MERGED_NEEDLE = 'not fully merged'

async function refreshAfterChange(repoPath: string): Promise<void> {
  await Promise.all([useChangesStore.getState().load(repoPath), useProjectsStore.getState().load()])
}

async function runChange(repoPath: string, action: () => Promise<void>, failureMessage: string): Promise<boolean> {
  try {
    await action()
  } catch (error) {
    toast.error(friendlyErrorMessage(error, failureMessage))
    return false
  } finally {
    await refreshAfterChange(repoPath)
  }
  return true
}

export async function createBranchFlow(repoPath: string): Promise<void> {
  const name = await askForText({
    title: 'New branch',
    message: 'The branch starts from your current commit and is switched to right away.',
    placeholder: 'feature/my-change',
    confirmLabel: 'Create branch'
  })
  if (name === null) {
    return
  }
  const isDone = await runChange(
    repoPath,
    () => window.api.git.createBranch({ repoPath, name }),
    'Could not create the branch.'
  )
  if (isDone) {
    toast.success(`Created and switched to ${name}.`)
  }
}

export async function renameBranchFlow(repoPath: string, currentName: string): Promise<void> {
  const to = await askForText({
    title: `Rename "${currentName}"`,
    placeholder: 'New name',
    initialValue: currentName,
    confirmLabel: 'Rename'
  })
  if (to === null || to === currentName) {
    return
  }
  const isDone = await runChange(
    repoPath,
    () => window.api.git.renameBranch({ repoPath, from: currentName, to }),
    'Could not rename the branch.'
  )
  if (isDone) {
    toast.success(`Renamed to ${to}. The remote branch, if any, keeps its old name.`)
  }
}

export async function deleteBranchFlow(repoPath: string, name: string): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: `Delete branch "${name}"?`,
    message: 'The branch is removed from this computer. Commits that are only on it can be lost.',
    confirmLabel: 'Delete'
  })
  if (!isConfirmed) {
    return
  }

  try {
    await window.api.git.deleteBranch({ repoPath, name, force: false })
    toast.success(`Deleted ${name}.`)
  } catch (error) {
    const isUnmerged = error instanceof Error && error.message.includes(NOT_MERGED_NEEDLE)
    if (!isUnmerged) {
      toast.error(friendlyErrorMessage(error, 'Could not delete the branch.'))
    } else if (await askForceDelete(name)) {
      const isDone = await runChange(
        repoPath,
        () => window.api.git.deleteBranch({ repoPath, name, force: true }),
        'Could not delete the branch.'
      )
      if (isDone) {
        toast.success(`Deleted ${name}.`)
      }
    }
  } finally {
    await refreshAfterChange(repoPath)
  }
}

function askForceDelete(name: string): Promise<boolean> {
  return askToConfirm({
    title: 'Delete anyway?',
    message: `"${name}" has commits that are not on any other branch. Deleting it loses them.`,
    confirmLabel: 'Delete anyway'
  })
}

export async function undoLastCommitFlow(repoPath: string, status: GitStatus): Promise<void> {
  const isPublished = status.upstream !== null && status.ahead === 0
  const publishedWarning = isPublished
    ? ' This commit is already on the remote, so you would need a force push to remove it there, and o-bros does not force push.'
    : ''
  const isConfirmed = await askToConfirm({
    title: 'Undo the last commit?',
    message: `The commit is removed from the branch and its changes go back to staged, so nothing is lost.${publishedWarning}`,
    confirmLabel: 'Undo commit'
  })
  if (!isConfirmed) {
    return
  }
  const isDone = await runChange(repoPath, () => window.api.git.undoCommit(repoPath), 'Could not undo the commit.')
  if (isDone) {
    toast.success('Commit undone. Its changes are staged.')
  }
}

export async function amendLastCommitFlow(repoPath: string, status: GitStatus): Promise<void> {
  let currentMessage = ''
  try {
    currentMessage = await window.api.git.lastMessage(repoPath)
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not read the last commit.'))
    return
  }
  const isPublished = status.upstream !== null && status.ahead === 0
  const message = await askForText({
    title: 'Change the last commit message',
    message: isPublished
      ? 'This commit is already on the remote. Changing it means the remote needs a force push, and o-bros does not force push.'
      : 'Only the message changes. Staged files are not added to the commit.',
    initialValue: currentMessage,
    confirmLabel: 'Change message',
    isMultiline: true
  })
  if (message === null || message === currentMessage) {
    return
  }
  const isDone = await runChange(
    repoPath,
    () => window.api.git.amendCommit({ repoPath, message }),
    'Could not change the commit message.'
  )
  if (isDone) {
    toast.success('Commit message changed.')
  }
}
