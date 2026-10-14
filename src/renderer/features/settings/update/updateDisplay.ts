import type { UpdateStatus } from '../../../../shared/types'

export type UpdateTone = 'neutral' | 'success' | 'attention' | 'busy'

export interface UpdateDisplay {
  tone: UpdateTone
  title: string
  detail: string
  tag: string | null
  showsProgress: boolean
}

export function describeUpdate(status: UpdateStatus | null): UpdateDisplay {
  const currentVersion = status?.currentVersion ?? ''
  const latestVersion = status?.latestVersion ?? ''

  switch (status?.state) {
    case 'unavailable':
      return {
        tone: 'neutral',
        title: 'Running from source',
        detail: status.message ?? 'Updates are only available in the installed app.',
        tag: 'Development build',
        showsProgress: false
      }
    case 'checking':
      return {
        tone: 'busy',
        title: 'Checking for updates',
        detail: 'Asking GitHub for the newest version.',
        tag: null,
        showsProgress: false
      }
    case 'upToDate':
      return {
        tone: 'success',
        title: 'You are up to date',
        detail: `o-bros ${currentVersion} is the newest version.`,
        tag: 'Latest',
        showsProgress: false
      }
    case 'available':
      return {
        tone: 'attention',
        title: `Version ${latestVersion} is available`,
        detail: `You have ${currentVersion}. Downloading does not change the running app.`,
        tag: 'New',
        showsProgress: false
      }
    case 'downloading':
      return {
        tone: 'busy',
        title: latestVersion === '' ? 'Downloading the update' : `Downloading version ${latestVersion}`,
        detail: 'The running app is not changed until you restart.',
        tag: null,
        showsProgress: true
      }
    case 'ready':
      return {
        tone: 'success',
        title: latestVersion === '' ? 'Update ready to install' : `Version ${latestVersion} is ready to install`,
        detail:
          'Restart closes o-bros, installs the update and opens it again. Running terminals stop, and your tabs come back in the same folders.',
        tag: 'Ready',
        showsProgress: false
      }
    case 'failed':
      return {
        tone: 'neutral',
        title: 'Could not check for updates',
        detail: status.message ?? 'Check your connection, or open the releases page.',
        tag: null,
        showsProgress: false
      }
    default:
      return {
        tone: 'neutral',
        title: 'Not checked yet',
        detail: `o-bros ${currentVersion} is installed. Press Check for updates to look on GitHub.`,
        tag: null,
        showsProgress: false
      }
  }
}
