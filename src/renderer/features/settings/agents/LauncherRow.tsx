import { Trash2 } from 'lucide-react'
import type { AgentLauncher } from '../../../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../../../state/agentLaunchersStore'
import { AgentIcon } from '../../../ui/AgentIcon'
import { AgentUsageNote } from '../../../ui/AgentUsageNote'
import { AgentStatusBadge } from '../../../ui/AgentStatusBadge'
import { Button } from '../../../ui/Button'

interface LauncherRowProps {
  launcher: AgentLauncher
  isShown: boolean
  canShowMore: boolean
}

export function LauncherRow({ launcher, isShown, canShowMore }: LauncherRowProps) {
  const update = useAgentLaunchersStore((state) => state.update)
  const remove = useAgentLaunchersStore((state) => state.remove)
  const toggleShown = useAgentLaunchersStore((state) => state.toggleShown)
  const hint = isShown || canShowMore ? 'Show as a button in Projects' : 'Two buttons fit. Hide another first.'

  return (
    <div className="table-row">
      <span className="agent-icon">
        <AgentIcon command={launcher.command} />
      </span>
      <label className="agent-show" title={hint}>
        <input
          type="checkbox"
          checked={isShown}
          disabled={!isShown && !canShowMore}
          onChange={() => toggleShown(launcher.id)}
        />
        Show
      </label>
      <input
        className="field field-prefix"
        placeholder="Button name"
        value={launcher.name}
        onChange={(event) => update(launcher.id, { name: event.target.value })}
      />
      <input
        className="field field-command"
        placeholder="Command, for example opencode"
        spellCheck={false}
        value={launcher.command}
        onChange={(event) => update(launcher.id, { command: event.target.value })}
      />
      <span className="agent-status-cell">
        <AgentStatusBadge command={launcher.command} />
        <AgentUsageNote command={launcher.command} />
      </span>
      <Button variant="remove" title="Remove" onClick={() => remove(launcher.id)}>
        <Trash2 size={14} />
      </Button>
    </div>
  )
}
