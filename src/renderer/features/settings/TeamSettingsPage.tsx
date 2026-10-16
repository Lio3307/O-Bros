import { useEffect, useState } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { shortAgentName } from '../../../shared/agentLaunchers'
import type { WotSkillTarget } from '../../../shared/types'
import { useTeamStore } from '../../state/teamStore'
import { toast } from '../../state/toastStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { Chip } from '../../ui/Chip'
import { Button } from '../../ui/Button'
import { LoadingText } from '../../ui/LoadingText'
import { SettingsPageLayout } from '../../ui/SettingsPageLayout'
import { SettingsSection } from '../../ui/SettingsSection'
import { exampleAgentName, useInstalledTeamAgents } from '../team/useInstalledTeamAgents'
import { TeamMemorySetting } from './TeamMemorySetting'
import './settings.css'

function versionText(target: WotSkillTarget): string {
  if (target.status === 'missing') {
    return `Not installed · version ${target.availableVersion} available`
  }
  if (target.status === 'outdated') {
    return `Version ${target.installedVersion} installed · ${target.availableVersion} available`
  }
  return `Version ${target.installedVersion} installed`
}

function readByText(target: WotSkillTarget): string {
  if (target.readBy.length === 0) {
    return 'No agent that reads this folder was found on this computer.'
  }
  return `Used by: ${target.readBy.join(', ')}`
}

function installLabel(target: WotSkillTarget): string {
  if (target.status === 'outdated') {
    return `Update to ${target.availableVersion}`
  }
  return target.status === 'missing' ? 'Install' : 'Reinstall'
}

function SkillRow({ target, onChanged }: { target: WotSkillTarget; onChanged: () => Promise<void> }) {
  async function install(): Promise<void> {
    try {
      await window.api.wot.installSkill(target.id)
      toast.success(`wot ${target.availableVersion} is installed for ${target.title}. Restart the agent if it is running.`)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not install the skill.'))
    }
    await onChanged()
  }

  async function remove(): Promise<void> {
    try {
      await window.api.wot.removeSkill(target.id)
      toast.success(`Removed wot from ${target.title}.`)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not remove the skill.'))
    }
    await onChanged()
  }

  return (
    <div className="table-row">
      <AgentIcon command={target.iconCommand} size={16} />
      <div className="cell cell-account">
        <span className="account-label">{target.title}</span>
        <span className="muted">{readByText(target)}</span>
        <span className="muted">{versionText(target)}</span>
        <span className="muted">{target.skillPath}</span>
      </div>
      {target.status !== 'installed' && (
        <Button variant={target.status === 'outdated' ? 'primary' : 'outline'} onClick={install}>
          {installLabel(target)}
        </Button>
      )}
      {target.status !== 'missing' && (
        <Button variant="remove" onClick={remove}>
          Remove
        </Button>
      )}
    </div>
  )
}

function InstalledAgentsSection() {
  const agents = useInstalledTeamAgents()

  return (
    <SettingsSection
      title="Agents on this computer"
      description={
        <>
          wot is not only for Claude and Codex: it works with every agent CLI installed on this computer. O-BROS found the
          ones below, and any of them can join a team as a member. To let an agent bring in others, install wot for it
          above. Install another agent CLI and it shows up here.
        </>
      }
    >
      {agents === null && <p className="muted"><LoadingText text="Looking for agents on this computer…" /></p>}
      {agents !== null && agents.length === 0 && (
        <p className="muted">No agent CLI was found on this computer. Add one in Settings → Agents.</p>
      )}
      {agents !== null && agents.length > 0 && (
        <div className="team-agent-chips">
          {agents.map((agent) => (
            <Chip key={agent.command} title={agent.command} icon={<AgentIcon command={agent.command} size={14} />}>
              {shortAgentName(agent.name)}
            </Chip>
          ))}
        </div>
      )}
    </SettingsSection>
  )
}

function HowToUseSection() {
  const agents = useInstalledTeamAgents()
  const reviewer = exampleAgentName(agents, 1)
  const helper = exampleAgentName(agents, 2)

  return (
    <SettingsSection
      title="How to use it"
      description={
        <>
          Start an agent that has wot from O-BROS and ask it, in your own words, to bring in another agent by name, for
          example: &quot;ask {reviewer} to review src/login.ts&quot; or &quot;use {helper} to write tests for this file
          while you fix the bug&quot;. You do not have to say &quot;wot&quot;; naming the agent is enough. The agent
          checks which agents are installed, summons them, waits for their answers and stops them when they are done. If
          you ask for an agent that is not installed, it tells you and lists the ones you have instead of installing it.
        </>
      }
    />
  )
}

export function TeamSettingsPage() {
  const [targets, setTargets] = useState<WotSkillTarget[] | null>(null)
  const refreshInstalled = useTeamStore((state) => state.refreshInstalled)

  async function load(): Promise<void> {
    try {
      setTargets(await window.api.wot.skillTargets())
    } catch (error) {
      setTargets([])
      toast.error(friendlyErrorMessage(error, 'Could not find where your agents keep their skills.'))
    }
    await refreshInstalled()
  }

  useEffect(() => {
    void load()
  }, [])

  return (
    <SettingsPageLayout
      title="Team (wot)"
      description={
        <>
          wot (work of teams) is optional. When you install it for an agent, that agent can bring in any other agent
          CLI installed on this computer, whichever ones you use. They run in hidden terminals that you can watch and stop in the Team view. Nothing
          changes until you install it.
        </>
      }
    >
      <SettingsSection
        title="Install for your agents"
        description={
          <>
            wot is a skill: a text file with instructions that the agent reads. Choose the agents that should have it.
            Each row shows which of your agents read that folder: Claude Code reads its own folder, and most other agents
            (for example Codex, Gemini CLI, GitHub Copilot CLI or OpenCode) read the shared folder of the Agent Skills
            standard. The file contains no passwords or tokens. Restart an agent
            that is already running so it notices the change.
          </>
        }
      >
        <div className="table">
          {targets === null && <p className="panel-empty"><LoadingText text="Looking for skill folders…" /></p>}
          {(targets ?? []).map((target) => (
            <SkillRow key={target.id} target={target} onChanged={load} />
          ))}
        </div>
      </SettingsSection>

      <InstalledAgentsSection />

      <HowToUseSection />

      <TeamMemorySetting />

      <SettingsSection
        title="Good to know"
        description={
          <>
            wot only works while O-BROS is open, and only for agents started from an O-BROS terminal. Outside O-BROS, or
            before you install it here, the agent tells you what is missing. Team members cannot summon more agents, and
            at most six can run at the same time. When a member asks a question, you get a notification and a red number on
            the Team button.
          </>
        }
      />
    </SettingsPageLayout>
  )
}
