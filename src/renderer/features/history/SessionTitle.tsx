import { useHistoryStore } from '../../state/historyStore'

export function SessionTitle({ sessionId, title }: { sessionId: string; title: string }) {
  const threadTitle = useHistoryStore((state) => {
    const thread = state.threads.find((candidate) => candidate.parts.some((part) => part.sessionId === sessionId))
    return thread === undefined || thread.parts[0]?.sessionId === sessionId ? null : thread.title
  })
  return <>{threadTitle === null ? title : `Continued: ${threadTitle}`}</>
}
