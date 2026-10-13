import { CircleAlert, TriangleAlert } from 'lucide-react'
import { lastPathSegment } from '../../../shared/paths'
import { useEditorNavigationStore } from '../../state/editorNavigationStore'
import { useProblemsStore } from '../../state/problemsStore'
import './problems.css'

interface ProblemsPopoverProps {
  onNavigate: () => void
}

export function ProblemsPopover({ onNavigate }: ProblemsPopoverProps) {
  const byFile = useProblemsStore((state) => state.byFile)
  const goTo = useEditorNavigationStore((state) => state.goTo)
  const filePaths = Object.keys(byFile).sort()

  return (
    <div className="problems-popover" role="dialog" aria-label="Problems">
      <header className="problems-header">Problems in open files</header>
      <div className="problems-body">
        {filePaths.length === 0 && <p className="panel-empty">No problems found. Open a JavaScript or TypeScript file to check it.</p>}
        {filePaths.map((filePath) => (
          <section key={filePath}>
            <h3 className="section-label problems-file" title={filePath}>
              {lastPathSegment(filePath)}
            </h3>
            {byFile[filePath].map((problem, index) => {
              const Icon = problem.severity === 'error' ? CircleAlert : TriangleAlert
              return (
                <button
                  key={`${problem.line}-${problem.column}-${index}`}
                  type="button"
                  className="problem-row"
                  onClick={() => {
                    goTo({ path: filePath, line: problem.line, column: problem.column })
                    onNavigate()
                  }}
                >
                  <Icon size={14} className="problem-icon" />
                  <span className="problem-message">{problem.message}</span>
                  <span className="muted problem-position">
                    {problem.line}:{problem.column}
                  </span>
                </button>
              )
            })}
          </section>
        ))}
      </div>
    </div>
  )
}
