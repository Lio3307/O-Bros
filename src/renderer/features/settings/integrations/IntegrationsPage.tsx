import { useCallback, useState } from 'react'
import { friendlyErrorMessage } from '../../../../shared/friendlyError'
import { INTEGRATIONS, type IntegrationsReport } from '../../../../shared/integrations'
import { toast } from '../../../state/toastStore'
import { SettingsPageLayout } from '../../../ui/SettingsPageLayout'
import { SettingsSection } from '../../../ui/SettingsSection'
import { useLiveRefresh } from '../../../ui/useLiveRefresh'
import { IntegrationCard } from './IntegrationCard'
import './integrations.css'

export function IntegrationsPage() {
  const [report, setReport] = useState<IntegrationsReport | null>(null)
  const [isChecking, setIsChecking] = useState(false)

  const recheck = useCallback(async () => {
    setIsChecking(true)
    try {
      setReport(await window.api.integrations.read())
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not check the integrations. Please try again.'))
    } finally {
      setIsChecking(false)
    }
  }, [])

  useLiveRefresh(recheck, null, { refreshNow: true })

  return (
    <SettingsPageLayout
      title="Integrations"
      description="Connect the code hosts that O-BROS and the agents in your terminals use for pull requests, issues and checks."
    >
      <SettingsSection
        title="Code hosts"
        description="Each host works through its official command-line tool and the sign-in that tool keeps on this computer. O-BROS never sees, stores or sends your token."
      >
        <div className="integration-list">
          {INTEGRATIONS.map((info) => (
            <IntegrationCard
              key={info.id}
              info={info}
              status={report?.statuses.find((status) => status.id === info.id) ?? null}
              canInstallWithWinget={report?.canInstallWithWinget ?? false}
              isChecking={isChecking}
              onRecheck={() => void recheck()}
            />
          ))}
        </div>
      </SettingsSection>
    </SettingsPageLayout>
  )
}
