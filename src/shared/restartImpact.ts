function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`
}

export function describeRestartImpact(runningTaskCount: number, unsavedFileCount: number): string | null {
  const parts: string[] = []
  if (runningTaskCount > 0) {
    parts.push(`${countLabel(runningTaskCount, 'terminal is', 'terminals are')} still running something. It will stop.`)
  }
  if (unsavedFileCount > 0) {
    parts.push(`${countLabel(unsavedFileCount, 'file has', 'files have')} changes that are not saved.`)
  }
  if (parts.length === 0) {
    return null
  }
  return `${parts.join(' ')} Your tabs come back after the restart as new terminals in the same folders. Agents keep their own conversations; Claude and Codex ones can be resumed from History.`
}
