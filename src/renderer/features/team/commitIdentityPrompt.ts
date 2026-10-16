import { isValidCommitIdentity, type CommitIdentity } from '../../../shared/commitIdentity'
import { useAgentCommitStore } from '../../state/agentCommitStore'
import { askForText } from '../../state/textPromptStore'

async function askName(current: string): Promise<string | null> {
  return askForText({
    title: 'Name for commits made by agents',
    message:
      'Agents commit with this name instead of your global git settings, so the commit shows as yours. Use the name of your GitHub account.',
    placeholder: 'Your name',
    initialValue: current,
    confirmLabel: 'Next'
  })
}

async function askEmail(current: string): Promise<string | null> {
  return askForText({
    title: 'Email for commits made by agents',
    message:
      'Use the email of your GitHub account so GitHub links the commit to you. To keep your email private, use your GitHub noreply address (Settings → Emails on GitHub), for example 12345+name@users.noreply.github.com.',
    placeholder: 'you@example.com',
    initialValue: current,
    confirmLabel: 'Save'
  })
}

export async function ensureCommitIdentity(): Promise<CommitIdentity | null> {
  const saved = useAgentCommitStore.getState().identity
  if (isValidCommitIdentity(saved)) {
    return saved
  }
  const name = await askName(saved.name)
  if (name === null) {
    return null
  }
  const email = await askEmail(saved.email)
  if (email === null) {
    return null
  }
  const identity = { name: name.trim(), email: email.trim() }
  if (!isValidCommitIdentity(identity)) {
    return null
  }
  useAgentCommitStore.getState().setIdentity(identity)
  return identity
}
