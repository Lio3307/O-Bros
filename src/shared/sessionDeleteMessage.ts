import { formatBytes } from './format'

export interface SessionDeleteMessage {
  title: string
  message: string
  confirmLabel: string
}

export function describeSessionDelete(sessionCount: number, totalBytes: number, permanently: boolean): SessionDeleteMessage {
  const isSingle = sessionCount === 1
  const noun = isSingle ? 'session' : 'sessions'
  const pronoun = isSingle ? 'it' : 'them'
  const spaceSentence = permanently
    ? `This frees about ${formatBytes(totalBytes)} right away and cannot be undone.`
    : `This frees about ${formatBytes(totalBytes)} once the Recycle Bin or Trash is emptied. Until then you can restore ${pronoun} from there.`

  return {
    title: `Delete ${sessionCount} ${noun}?`,
    message: `You will not be able to resume ${pronoun} or read ${pronoun} in History. ${spaceSentence} Your project files and logins are not touched.`,
    confirmLabel: permanently ? 'Delete permanently' : 'Move to Recycle Bin'
  }
}
