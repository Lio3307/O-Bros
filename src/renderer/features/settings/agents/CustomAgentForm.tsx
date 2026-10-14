import { Plus } from 'lucide-react'
import { useState } from 'react'
import { isUsableLauncher } from '../../../../shared/agentLaunchers'
import { useAgentLaunchersStore } from '../../../state/agentLaunchersStore'
import { AgentStatusBadge } from '../../../ui/AgentStatusBadge'
import { Button } from '../../../ui/Button'

export function CustomAgentForm({ onDone }: { onDone: () => void }) {
  const add = useAgentLaunchersStore((state) => state.add)
  const [name, setName] = useState('')
  const [command, setCommand] = useState('')
  const canAdd = isUsableLauncher(name, command)

  function submit(): void {
    if (canAdd) {
      add(name.trim(), command.trim())
      onDone()
    }
  }

  return (
    <section className="add-account-form">
      <h2 className="settings-subtitle">Add a custom agent</h2>
      <p className="muted">
        For an agent CLI that is not in the lists below, such as your own tool. The command runs in a new terminal in
        the selected folder, so you can include arguments.
      </p>
      <div className="add-account-row">
        <input
          className="field field-prefix"
          placeholder="Button name"
          value={name}
          onChange={(event) => setName(event.target.value)}
        />
        <input
          className="field field-command"
          placeholder="Command, for example my-agent --fast"
          spellCheck={false}
          value={command}
          onChange={(event) => setCommand(event.target.value)}
          onKeyDown={(event) => event.key === 'Enter' && submit()}
        />
        {command.trim() !== '' && <AgentStatusBadge command={command} />}
      </div>
      <div className="add-account-row">
        <Button variant="primary" disabled={!canAdd} onClick={submit}>
          <Plus size={14} /> Add agent
        </Button>
        <Button variant="outline" onClick={onDone}>
          Cancel
        </Button>
      </div>
    </section>
  )
}
