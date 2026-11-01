import { useEffect, useState } from 'react'
import { providerOfCommand } from '../../../shared/agentLaunchers'
import { listTeamAgents, type TeamAgentOption } from '../../../shared/teamAgents'
import { useAgentCatalogStore } from '../../state/agentCatalogStore'
import { useAgentLaunchersStore } from '../../state/agentLaunchersStore'
import { useContinueDialogStore, type ContinueRequest } from '../../state/continueDialogStore'
import { useInstalledCommandsStore } from '../../state/installedCommandsStore'
import { useLayoutStore } from '../../state/layoutStore'
import { AgentIcon } from '../../ui/AgentIcon'
import { Button } from '../../ui/Button'
import { Combobox } from '../../ui/Combobox'
import { LoadingText } from '../../ui/LoadingText'
import { Modal } from '../../ui/Modal'
import { Notice } from '../../ui/Notice'
import { ProviderMark } from '../../ui/ProviderMark'
import { continueWithAgent } from './continueWithAgent'
import { SessionTitle } from './SessionTitle'
import './continueDialog.css'

const INSTALLED_LIST_MAX_AGE_MS = 60_000
const TITLE_ID = 'continue-dialog-title'

function openAgentSettings(close: () => void): void {
  close()
  useLayoutStore.getState().selectSettingsPage('agents')
  useLayoutStore.getState().showSection('settings')
}

function ContinueForm({ request, close }: { request: ContinueRequest; close: () => void }) {
  const launchers = useAgentLaunchersStore((state) => state.launchers)
  const installedCommands = useInstalledCommandsStore((state) => state.commands)
  const refreshIfOlderThan = useInstalledCommandsStore((state) => state.refreshIfOlderThan)
  const registry = useAgentCatalogStore((state) => state.registry)
  const [pickedCommand, setPickedCommand] = useState<string | null>(null)

  useEffect(() => {
    void refreshIfOlderThan(INSTALLED_LIST_MAX_AGE_MS)
  }, [refreshIfOlderThan])

  const isSameAgent = (agent: TeamAgentOption) => providerOfCommand(agent.command) === request.provider
  const agents = listTeamAgents(launchers, registry, installedCommands ?? []).filter((agent) => agent.isInstalled)
  const chosen = agents.find((agent) => agent.command === pickedCommand) ?? agents.find((agent) => !isSameAgent(agent)) ?? agents[0] ?? null
  const isChecking = installedCommands === null

  function start(): void {
    if (chosen !== null) {
      close()
      void continueWithAgent(request.sessionFilePath, chosen)
    }
  }

  return (
    <Modal
      title="Continue in another agent"
      titleId={TITLE_ID}
      onEscape={close}
      actions={
        <>
          <Button variant="outline" onClick={close}>
            Cancel
          </Button>
          <Button variant="primary" autoFocus disabled={chosen === null || isChecking} onClick={start}>
            {chosen === null || isChecking ? 'Continue' : `Continue in ${chosen.name}`}
          </Button>
        </>
      }
    >
      <div className="modal-section">
        <span className="modal-label muted">Conversation</span>
        <div className="modal-item">
          <span className="modal-item-title continue-title">
            <ProviderMark provider={request.provider} />
            <span className="continue-title-text">
              {request.sessionId === null ? request.title : <SessionTitle sessionId={request.sessionId} title={request.title} />}
            </span>
          </span>
          {request.folder !== null && <span className="muted continue-folder">{request.folder}</span>}
        </div>
      </div>
      {isChecking && <LoadingText text="Looking for your agents…" />}
      {!isChecking && chosen === null && (
        <Notice
          tone="warning"
          title="No agent found on this computer"
          actions={<Button onClick={() => openAgentSettings(close)}>Open Agents settings</Button>}
        >
          Install an agent or add one in Settings → Agents, then come back.
        </Notice>
      )}
      {!isChecking && chosen !== null && (
        <>
          <div className="modal-section">
            <span className="modal-label muted">Continue with</span>
            <Combobox
              className="continue-agent"
              searchPlaceholder="Find an agent"
              noMatchText="No agent matches that."
              title="Choose the agent that takes over"
              label={chosen.name}
              value={chosen.command}
              icon={<AgentIcon command={chosen.command} />}
              loadOptions={() =>
                agents.map((agent) => ({
                  value: agent.command,
                  label: agent.name,
                  icon: <AgentIcon command={agent.command} />,
                  hint: isSameAgent(agent) ? 'same agent' : undefined
                }))
              }
              onChange={setPickedCommand}
            />
          </div>
          <ul className="continue-steps muted">
            <li>{chosen.name} opens in a new tab and gets a recap of what was said and done, so it can pick up from there.</li>
            <li>This conversation stays as it is in History.</li>
            <li>Anything that looks like a password or key is left out of the recap.</li>
          </ul>
        </>
      )}
    </Modal>
  )
}

export function ContinueDialog() {
  const request = useContinueDialogStore((state) => state.request)
  const close = useContinueDialogStore((state) => state.close)
  return request === null ? null : <ContinueForm key={request.sessionFilePath} request={request} close={close} />
}
