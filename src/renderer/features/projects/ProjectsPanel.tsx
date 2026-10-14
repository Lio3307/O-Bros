import { Bot, ChevronDown, ChevronRight, Folder, FolderPlus, GitBranch, Terminal } from 'lucide-react'
import { useState } from 'react'
import { isPrimaryBranch } from '../../../shared/gitSync'
import { isPathInside } from '../../../shared/paths'
import { formatAge } from '../../../shared/time'
import type { ProjectRoot } from '../../../shared/types'
import { useActiveProjectTabs } from '../../state/activeProjectTabs'
import { useAttentionStore } from '../../state/attentionStore'
import { agentStatusOf, programOf, shortAgentName, shownLaunchers, type AgentLauncher } from '../../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useInstalledCommandsStore } from '../../state/installedCommandsStore'
import { useLayoutStore } from '../../state/layoutStore'
import { openAgent, openTerminal } from '../../state/openTerminal'
import { AgentIcon } from '../../ui/AgentIcon'
import { AgentStatusBadge } from '../../ui/AgentStatusBadge'
import { useProjectsStore } from '../../state/projectsStore'
import { toast } from '../../state/toastStore'
import { isTerminalTab, useWorkspaceStore } from '../../state/workspaceStore'
import { PanelHeader } from '../../ui/PanelHeader'
import { ScriptsList } from './ScriptsList'
import { useNow } from '../../ui/useNow'
import './projects.css'
import { Button } from '../../ui/Button'

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
  const projectTabs = useActiveProjectTabs()
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const activateTab = useWorkspaceStore((state) => state.activateTab)
  const now = useNow(SESSION_AGE_REFRESH_MS)

  const sessions = projectTabs
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

function useFinishedElsewhere(): (folderPath: string) => boolean {
  const tabs = useWorkspaceStore((state) => state.tabs)
  const attentionTabIds = useAttentionStore((state) => state.tabIds)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)

  return (folderPath) =>
    folderPath !== activeProjectPath &&
    tabs.filter(isTerminalTab).some((tab) => {
      const isInFolder = tab.cwd !== null && isPathInside(tab.cwd, folderPath)
      return isInFolder && attentionTabIds.includes(tab.id)
    })
}

function FolderList({ root }: { root: ProjectRoot }) {
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const selectProject = useProjectsStore((state) => state.selectProject)
  const hasFinishedElsewhere = useFinishedElsewhere()

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
          {hasFinishedElsewhere(folder.path) && (
            <span className="tab-attention-dot" title="A terminal here finished while you were away" />
          )}
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
        <Button variant="icon" title="Show or hide folders" onClick={() => setIsCollapsed(!isCollapsed)}>
          <Chevron size={14} />
        </Button>
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
  const savedLaunchers = useAgentLaunchersStore((state) => state.launchers)
  const shownIds = useAgentLaunchersStore((state) => state.shownIds)
  const launchers = shownLaunchers(savedLaunchers, shownIds)
  const openSection = useLayoutStore((state) => state.openSection)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  const installedCommands = useInstalledCommandsStore((state) => state.commands)

  function chooseAgents(): void {
    selectSettingsPage('agents')
    openSection('settings')
  }

  async function startAgent(launcher: AgentLauncher): Promise<void> {
    if (agentStatusOf(launcher.command, installedCommands) === 'missing') {
      await useInstalledCommandsStore.getState().load()
    }
    const latestCommands = useInstalledCommandsStore.getState().commands
    if (agentStatusOf(launcher.command, latestCommands) === 'missing') {
      toast.warning(`"${programOf(launcher.command)}" was not found in your PATH. Check it in Settings, Agents.`)
      chooseAgents()
      return
    }
    openAgent(launcher)
  }

  return (
    <div className="panel-content">
      <div className="panel-sticky">
        <PanelHeader title="Projects">
          <Button variant="icon" title="Open a folder" onClick={() => addRoot()}>
            <FolderPlus size={16} />
          </Button>
        </PanelHeader>
        <div className="start-buttons">
          {launchers.map((launcher) => (
            <Button
              key={launcher.id}
              variant="outline"
              className="agent-button"
              title={`${shortAgentName(launcher.name)}: run "${launcher.command}" in the selected folder`}
              aria-label={shortAgentName(launcher.name)}
              onClick={() => startAgent(launcher)}
            >
              <AgentIcon command={launcher.command} size={16} />
              <AgentStatusBadge command={launcher.command} showLabel={false} />
            </Button>
          ))}
          {launchers.length === 0 && (
            <Button variant="outline" title="Choose agent buttons" onClick={chooseAgents}>
              <Bot size={14} /> Agents
            </Button>
          )}
          <Button variant="outline" title="Plain terminal in the selected folder" onClick={() => openTerminal(null)}>
            <Terminal size={14} />
          </Button>
        </div>
      </div>
      {roots.length === 0 && <p className="panel-empty">Open a folder to see your projects.</p>}
      {roots.map((root) => (
        <RootBlock key={root.path} root={root} />
      ))}
    </div>
  )
}
