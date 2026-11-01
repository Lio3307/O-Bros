import { askToConfirm } from '../../state/confirmStore'
import { useGitRepositoryStore } from '../../state/gitRepositoryStore'
import { useProjectsStore } from '../../state/projectsStore'

const askedFolders = new Set<string>()

function messageFor(risks: string[]): string {
  return [
    'It has its own settings that can run programs on your computer as soon as O-BROS reads it:',
    ...risks.map((risk) => `• ${risk}`),
    '',
    "Only trust a folder if you know where it came from. Until you do, O-BROS's Git panel and this folder's own language server stay off. Terminals and your agents are not changed."
  ].join('\n')
}

export async function askToTrustFolder(folder: string): Promise<void> {
  const { isTrusted, risks } = await window.api.trust.check(folder)
  if (isTrusted || risks.length === 0) {
    return
  }
  askedFolders.add(folder)
  const isConfirmed = await askToConfirm({
    title: 'Do you trust this folder?',
    message: messageFor(risks),
    confirmLabel: 'Trust this folder',
    cancelLabel: 'Keep it off'
  })
  if (isConfirmed) {
    await window.api.trust.grant(folder)
  }
}

function askOnce(folder: string | null): void {
  if (folder !== null && !askedFolders.has(folder)) {
    void askToTrustFolder(folder).catch(() => undefined)
  }
}

export function startFolderTrustPrompts(): () => void {
  askOnce(useProjectsStore.getState().activeProjectPath)
  const stopProjects = useProjectsStore.subscribe((state, previous) => {
    if (state.activeProjectPath !== previous.activeProjectPath) {
      askOnce(state.activeProjectPath)
    }
  })
  const stopRepositories = useGitRepositoryStore.subscribe((state, previous) => {
    if (state.pinnedPath !== previous.pinnedPath) {
      askOnce(state.pinnedPath)
    }
  })
  return () => {
    stopProjects()
    stopRepositories()
  }
}
