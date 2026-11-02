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
  const place = `In ${folderName}${tabPart}.`
  const titleEnding = paneTitle === null ? '' : `: ${paneTitle}`
  if (notice === 'asking') {
    return {
      title: `${agentLabel === null ? 'A command' : agentLabel} is asking you a question${titleEnding}`,
      body: `${place} It needs your answer to go on.`
    }
  }
  return agentLabel === null
    ? { title: `Command finished${titleEnding}`, body: `${place} Click to see the result.` }
    : { title: `${agentLabel} finished its reply${titleEnding}`, body: `${place} It is waiting for your next message.` }
}
