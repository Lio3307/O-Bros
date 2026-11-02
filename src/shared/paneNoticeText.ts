export type PaneNotice = 'finished' | 'asking'

export interface PaneNoticeSource {
  agentLabel: string | null
  folderName: string
  customTabTitle: string | null
  paneTitle: string | null
}

export function describePaneNotice(notice: PaneNotice, source: PaneNoticeSource): { title: string; body: string } {
  const { agentLabel, folderName, customTabTitle, paneTitle } = source
  const tabPart = customTabTitle === null ? '' : `, tab "${customTabTitle}"`
  const panePart = paneTitle === null ? '' : `, pane "${paneTitle}"`
  const place = `In ${folderName}${tabPart}${panePart}.`
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
