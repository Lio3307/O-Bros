import { buildCodeMessage, buildDiffMessage, isWithinContextLimit, MAX_CONTEXT_CHARS } from '../../../shared/agentContext'
import { lastPathSegment } from '../../../shared/paths'
import { askForText } from '../../state/textPromptStore'
import { toast } from '../../state/toastStore'
import { sendPromptToTerminal } from '../terminal/sendToTerminal'

const TOO_LARGE_MESSAGE = `That is more than ${MAX_CONTEXT_CHARS.toLocaleString()} characters. Select less and try again.`

function askForQuestion(subject: string): Promise<string | null> {
  return askForText({
    title: `Send ${subject} to the terminal`,
    message:
      'It is inserted into the focused terminal as one block, so press Enter yourself. Use it with an agent such as Claude or Codex: a plain shell would run each line. Add a question if you like.',
    placeholder: 'For example: why does this fail when the list is empty?',
    confirmLabel: 'Send',
    isMultiline: true,
    allowEmpty: true
  })
}

interface CodeToSend {
  path: string
  code: string
  startLine?: number
  endLine?: number
}

export async function sendCodeToAgent(code: CodeToSend): Promise<void> {
  if (code.code.trim() === '') {
    toast.warning('There is nothing to send.')
    return
  }
  if (!isWithinContextLimit(code.code)) {
    toast.warning(TOO_LARGE_MESSAGE)
    return
  }
  const subject = code.startLine === undefined ? lastPathSegment(code.path) : 'the selection'
  const question = await askForQuestion(subject)
  if (question === null) {
    return
  }
  sendPromptToTerminal(buildCodeMessage({ ...code, question }), false)
}

export async function sendDiffToAgent(path: string, diff: string): Promise<void> {
  if (diff.trim() === '') {
    toast.warning('There is nothing to send.')
    return
  }
  if (!isWithinContextLimit(diff)) {
    toast.warning(TOO_LARGE_MESSAGE)
    return
  }
  const question = await askForQuestion(`the changes in ${lastPathSegment(path)}`)
  if (question === null) {
    return
  }
  sendPromptToTerminal(buildDiffMessage({ path, diff, question }), false)
}
