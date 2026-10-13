import { ChevronDown, ChevronRight, Folder, FolderPlus, GitBranch, Terminal } from 'lucide-react'
import { useState } from 'react'
import { isPrimaryBranch } from '../../../shared/gitSync'
import { isPathInside } from '../../../shared/paths'
import { formatAge } from '../../../shared/time'
import type { ProjectRoot } from '../../../shared/types'
import { openTerminal } from '../../state/openTerminal'
import { useProjectsStore } from '../../state/projectsStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { PanelHeader } from '../../ui/PanelHeader'
import { ScriptsList } from './ScriptsList'
import { ProviderMark } from '../../ui/ProviderMark'
import { useNow } from '../../ui/useNow'
import './projects.css'

const SESSION_AGE_REFRESH_MS = 60_000

function BranchLabel({ branch }: { branch: string }) {
  const className = isPrimaryBranch(branch) ? 'branch-label' : 'branch-label branch-label-feature'
  return (
    <span className={className} title={`Current branch: ${branch}`}>
      <GitBranch size={12} />
      {branch}
    </span>
  )
}

function SessionList({ root }: { root: ProjectRoot }) {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const activateTab = useWorkspaceStore((state) => state.activateTab)
  const now = useNow(SESSION_AGE_REFRESH_MS)

  const sessions = tabs
    .filter(isTerminalTab)
    .filter((tab) => tab.cwd !== null && isPathInside(tab.cwd, root.path))
  if (sessions.length === 0) {
    return null
  }

  return (
    <div className="root-section">
      <h3 className="section-label">Open sessions</h3>
      {sessions.map((session) => (
        <button
          key={session.id}
          type="button"
          className={session.id === activeTabId ? 'row row-session row-selected' : 'row row-session'}
          onClick={() => activateTab(session.id)}
        >
          <Terminal size={14} />
          <span className="row-name">{session.title}</span>
          <span className="muted">{formatAge(session.createdAt, now)}</span>
        </button>
      ))}
    </div>
  )
}

function FolderList({ root }: { root: ProjectRoot }) {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const selectProject = useProjectsStore((state) => state.selectProject)

  if (root.folders.length === 0) {
    return null
  }

  return (
    <div className="root-section">
      <h3 className="section-label">Folders</h3>
      {root.folders.map((folder) => (
        <button
          key={folder.path}
          type="button"
          title={folder.path}
          className={folder.path === activeProjectPath ? 'row row-selected' : 'row'}
          onClick={() => selectProject(folder.path)}
        >
          <Folder size={14} />
          <span className="row-name">{folder.name}</span>
          {folder.branch !== null && <BranchLabel branch={folder.branch} />}
        </button>
      ))}
    </div>
  )
}

function RootBlock({ root }: { root: ProjectRoot }) {
  const [isCollapsed, setIsCollapsed] = useState(false)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const selectProject = useProjectsStore((state) => state.selectProject)

  const Chevron = isCollapsed ? ChevronRight : ChevronDown
  const headerClassName = root.path === activeProjectPath ? 'root-header root-header-selected' : 'root-header'

  return (
    <section className="root-block">
      <div className={headerClassName}>
        <button type="button" className="icon-button" title="Show or hide folders" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Chevron size={14} />
        </button>
        <button type="button" className="root-name" title={root.path} onClick={() => selectProject(root.path)}>
          {root.name}
        </button>
        {root.branch !== null && <BranchLabel branch={root.branch} />}
      </div>
      {!isCollapsed && (
        <>
          <SessionList root={root} />
          <FolderList root={root} />
          <ScriptsList root={root} />
        </>
      )}
    </section>
  )
}

export function ProjectsPanel() {
  const roots = useProjectsStore((state) => state.roots)
  const addRoot = useProjectsStore((state) => state.addRoot)

  return (
    <div className="panel-content">
      <PanelHeader title="Projects">
        <button type="button" className="icon-button" title="Open a folder" onClick={() => void addRoot()}>
          <FolderPlus size={16} />
        </button>
      </PanelHeader>
      <div className="start-buttons">
        <button type="button" className="button-outline" title="Start Claude in the selected folder" onClick={() => openTerminal('claude')}>
          <ProviderMark provider="claude" /> Claude
        </button>
        <button type="button" className="button-outline" title="Start Codex in the selected folder" onClick={() => openTerminal('codex')}>
          <ProviderMark provider="codex" /> Codex
        </button>
        <button type="button" className="button-outline" title="Plain terminal in the selected folder" onClick={() => openTerminal(null)}>
          <Terminal size={14} />
        </button>
      </div>
      {roots.length === 0 && <p className="panel-empty">Open a folder to see your projects.</p>}
      {roots.map((root) => (
        <RootBlock key={root.path} root={root} />
      ))}
    </div>
  )
}
