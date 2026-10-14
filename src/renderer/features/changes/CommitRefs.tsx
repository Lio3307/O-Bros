const MAX_REFS_SHOWN = 3

function refClassName(reference: string): string {
  return reference.startsWith('tag: ') ? 'chip commit-ref commit-ref-tag' : 'chip commit-ref'
}

export function CommitRefs({ refs, limit = MAX_REFS_SHOWN }: { refs: string[]; limit?: number }) {
  if (refs.length === 0) {
    return null
  }
  return (
    <span className="commit-refs">
      {refs.slice(0, limit).map((reference) => (
        <span key={reference} className={refClassName(reference)}>
          {reference}
        </span>
      ))}
      {refs.length > limit && <span className="muted">+{refs.length - limit}</span>}
    </span>
  )
}
