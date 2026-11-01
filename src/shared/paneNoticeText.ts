export type PaneNotice = 'finished' | 'asking'

export interface PaneNoticeSource {
  agentLabel: string | null
  folderName: string
  customTabTitle: string | null
}

export function describePaneNotice(notice: PaneNotice, source: PaneNoticeSource): { title: string; body: string } {
  const { agentLabel, folderName, customTabTitle } = source
  const place = customTabTitle === null ? `In ${folderName}.` : `In ${folderName}, tab "${customTabTitle}".`
  if (notice === 'asking') {
    return {
      title: agentLabel === null ? 'A command is asking you a question' : `${agentLabel} is asking you a question`,
      body: `${place} It needs your answer to go on.`
    }
  }
  return agentLabel === null
    ? { title: 'Command finished', body: `${place} Click to see the result.` }
    : { title: `${agentLabel} finished its reply`, body: `${place} It is waiting for your next message.` }
}
