import { Bot, ChevronDown, ChevronRight, Folder, FolderPlus, GitBranch, Terminal } from 'lucide-react'
import { showTab } from '../../state/showTab'
import { closestProject } from '../../../shared/closestProject'
import { findTerminalPane } from '../../state/focusTerminalPane'
import { membersOfTab, useTeamStore } from '../../state/teamStore'
import { SessionMembers } from './SessionMembers'
import { Fragment, useCallback, useState } from 'react'
import { isPrimaryBranch } from '../../../shared/gitSync'
import { isPathInside } from '../../../shared/paths'
import { formatAge } from '../../../shared/time'
import type { ProjectRoot } from '../../../shared/types'
import { useActiveProjectTabs } from '../../state/activeProjectTabs'
import { useCollapsedRootsStore } from '../../state/collapsedRootsStore'
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
import { isTerminalTab, useWorkspaceStore, type TerminalTab } from '../../state/workspaceStore'
import { PanelHeader } from '../../ui/PanelHeader'
import { ScriptsList } from './ScriptsList'
import { TerminalTabIcon } from '../terminal/TerminalTabIcon'
import { placeSessions } from './sessionPlacement'
import { useLiveRefresh } from '../../ui/useLiveRefresh'
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

function SessionRow({ session, now }: { session: TerminalTab; now: number }) {
  const activeTabId = useWorkspaceStore((state) => state.activeTabId)
  const isShowingMember = useTeamStore((state) => state.shownMemberId !== null)
  const members = useTeamStore((state) => state.members)
  const sessionMembers = membersOfTab(members, Object.keys(session.panes))
  const isSelected = session.id === activeTabId && !isShowingMember

  const row = (
    <button
      type="button"
      className={isSelected ? 'row row-session row-selected' : 'row row-session'}
      title={sessionMembers.length === 0 ? undefined : `${session.title} · lead of ${sessionMembers.length} team member${sessionMembers.length === 1 ? '' : 's'}`}
      onClick={() => showTab(session.id)}
    >
      <TerminalTabIcon tab={session} />
      <span className="row-name">{session.title}</span>
      <span className="muted">{formatAge(session.createdAt, now)}</span>
    </button>
  )
  if (sessionMembers.length === 0) {
    return row
  }
  return (
    <div className="session-group">
      {row}
      <SessionMembers members={sessionMembers} now={now} />
    </div>
  )
}

function LeadClosedMembers({ rootPath, now }: { rootPath: string; now: number }) {
  const members = useTeamStore((state) => state.members)
  const roots = useProjectsStore((state) => state.roots)
  useWorkspaceStore((state) => state.tabs)
  const orphans = members.filter(
    (member) =>
      findTerminalPane(member.summonedByPaneId) === null &&
      member.cwd !== null &&
      closestProject(member.cwd, roots)?.path === rootPath
  )
  if (orphans.length === 0) {
    return null
  }
  return (
    <div className="session-group">
      <div className="row row-session session-group-closed" title="The terminal that summoned these members was closed">
        <Bot size={14} />
        <span className="row-name">Lead closed</span>
      </div>
      <SessionMembers members={orphans} now={now} />
    </div>
  )
}

const VISIBLE_NESTED_SESSIONS = 3

function FolderSessions({ sessions, now }: { sessions: TerminalTab[]; now: number }) {
  const [isExpanded, setIsExpanded] = useState(false)
  if (sessions.length === 0) {
    return null
  }
  const shown = isExpanded ? sessions : sessions.slice(0, VISIBLE_NESTED_SESSIONS)
  const hiddenCount = sessions.length - shown.length

  return (
    <div className="folder-sessions">
      {shown.map((session) => (
        <SessionRow key={session.id} session={session} now={now} />
      ))}
      {hiddenCount > 0 && (
        <button type="button" className="folder-sessions-more" onClick={() => setIsExpanded(true)}>
          Show {hiddenCount} more
        </button>
      )}
      {isExpanded && sessions.length > VISIBLE_NESTED_SESSIONS && (
        <button type="button" className="folder-sessions-more" onClick={() => setIsExpanded(false)}>
          Show fewer
        </button>
      )}
    </div>
  )
}

function RootSessions({ sessions, now }: { sessions: TerminalTab[]; now: number }) {
  if (sessions.length === 0) {
    return null
  }
  return (
    <div className="root-section">
      <h3 className="section-label">Open sessions</h3>
      {sessions.map((session) => (
        <SessionRow key={session.id} session={session} now={now} />
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

interface FolderListProps {
  root: ProjectRoot
  sessionsByFolder: Map<string, TerminalTab[]>
  now: number
}

function FolderList({ root, sessionsByFolder, now }: FolderListProps) {
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
        <Fragment key={folder.path}>
          <button
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
          <FolderSessions sessions={sessionsByFolder.get(folder.path) ?? []} now={now} />
        </Fragment>
      ))}
    </div>
  )
}

function RootBlock({ root }: { root: ProjectRoot }) {
  const isCollapsed = useCollapsedRootsStore((state) => state.paths.includes(root.path))
  const toggleCollapsed = useCollapsedRootsStore((state) => state.toggle)
  const activeProjectPath = useProjectsStore((state) => state.activeProjectPath)
  const selectProject = useProjectsStore((state) => state.selectProject)
  const projectTabs = useActiveProjectTabs()
  const now = useNow(SESSION_AGE_REFRESH_MS)
  const placement = placeSessions(
    projectTabs.filter(isTerminalTab),
    root.path,
    root.folders.map((folder) => folder.path)
  )

  const Chevron = isCollapsed ? ChevronRight : ChevronDown
  const headerClassName = root.path === activeProjectPath ? 'root-header root-header-selected' : 'root-header'

  return (
    <section className="root-block">
      <div className={headerClassName}>
        <Button variant="icon" title="Show or hide folders" onClick={() => toggleCollapsed(root.path)}>
          <Chevron size={14} />
        </Button>
        <button type="button" className="root-name" title={root.path} onClick={() => selectProject(root.path)}>
          {root.name}
        </button>
        {root.branch !== null && <BranchLabel branch={root.branch} />}
      </div>
      {!isCollapsed && (
        <>
          <RootSessions sessions={placement.atRoot} now={now} />
          <LeadClosedMembers rootPath={root.path} now={now} />
          <FolderList root={root} sessionsByFolder={placement.byFolderPath} now={now} />
          <ScriptsList root={root} />
        </>
      )}
    </section>
  )
}

export function ProjectsPanel() {
  const roots = useProjectsStore((state) => state.roots)
  const loadProjects = useProjectsStore((state) => state.load)
  const addRoot = useProjectsStore((state) => state.addRoot)
  const savedLaunchers = useAgentLaunchersStore((state) => state.launchers)
  const shownIds = useAgentLaunchersStore((state) => state.shownIds)
  const launchers = shownLaunchers(savedLaunchers, shownIds)
  const openSection = useLayoutStore((state) => state.openSection)
  const selectSettingsPage = useLayoutStore((state) => state.selectSettingsPage)

  const installedCommands = useInstalledCommandsStore((state) => state.commands)

  useLiveRefresh(useCallback(() => loadProjects(), [loadProjects]))

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
    await openAgent(launcher)
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
      {roots.length === 0 && <p className="panel-empty">No projects yet. Press the folder button above to open one.</p>}
      {roots.map((root) => (
        <RootBlock key={root.path} root={root} />
      ))}
    </div>
  )
}
