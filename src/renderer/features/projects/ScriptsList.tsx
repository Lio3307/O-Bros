import { Play } from 'lucide-react'
import { useEffect, useState } from 'react'
import { buildRunCommand, isSafeScriptName, type PackageManager } from '../../../shared/scripts'
import type { ProjectRoot, ProjectScripts } from '../../../shared/types'
import { runInTerminal } from '../../state/openTerminal'
import { useProjectsStore } from '../../state/projectsStore'

export function ScriptsList({ root }: { root: ProjectRoot }) {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const [project, setProject] = useState<ProjectScripts | null>(null)
  const isActive = activeProjectPath === root.path

  useEffect(() => {
    if (!isActive) {
      setProject(null)
      return
    }
    let isCurrent = true
    window.api.projects
      .scripts(root.path)
      .then((scripts) => isCurrent && setProject(scripts))
      .catch(() => isCurrent && setProject(null))
    return () => {
      isCurrent = false
    }
  }, [isActive, root.path])

  if (project === null || project.scripts.length === 0) {
    return null
  }

  const manager = project.packageManager as PackageManager

  return (
    <div className="root-section">
      <h3 className="section-label">Scripts</h3>
      {project.scripts.map((script) => (
        <button
          key={script.name}
          type="button"
          className="row row-session"
          title={script.command}
          disabled={!isSafeScriptName(script.name)}
          onClick={() => runInTerminal(root.path, buildRunCommand(manager, script.name), script.name)}
        >
          <Play size={14} />
          <span className="row-name">{script.name}</span>
        </button>
      ))}
    </div>
  )
}
