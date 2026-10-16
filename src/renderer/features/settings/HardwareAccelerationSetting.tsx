import { RotateCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { askToConfirm } from '../../state/confirmStore'
import { toast } from '../../state/toastStore'
import { Button } from '../../ui/Button'
import { SettingsSection } from '../../ui/SettingsSection'

interface AccelerationState {
  isSaved: boolean
  isActive: boolean
}

async function restartAfterConfirm(): Promise<void> {
  const isConfirmed = await askToConfirm({
    title: 'Restart O-BROS?',
    message: 'Open terminals and the programs running in them are closed. Your tabs come back after the restart.',
    confirmLabel: 'Restart'
  })
  if (isConfirmed) {
    await window.api.app.restart()
  }
}

export function HardwareAccelerationSetting() {
  const [state, setState] = useState<AccelerationState | null>(null)

  useEffect(() => {
    void window.api.app
      .hardwareAcceleration()
      .then(setState)
      .catch(() => setState(null))
  }, [])

  async function change(isEnabled: boolean): Promise<void> {
    try {
      await window.api.app.setHardwareAcceleration(isEnabled)
      setState(await window.api.app.hardwareAcceleration())
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not save the setting.'))
    }
  }

  if (state === null) {
    return null
  }
  const needsRestart = state.isSaved !== state.isActive

  return (
    <SettingsSection
      title="Graphics card"
      description={
        <>
          O-BROS uses the graphics card to draw the window, which keeps scrolling and animations smooth. Turning it off
          saves about 35 MB of memory (measured: 202 MB down to 167 MB at rest), but the window can feel slower. The change takes effect after a restart.
        </>
      }
      actions={
        needsRestart && (
          <Button variant="primary" onClick={() => void restartAfterConfirm()}>
            <RotateCw size={14} /> Restart now
          </Button>
        )
      }
    >
      <label className="toggle-row">
        <input type="checkbox" checked={state.isSaved} onChange={(event) => void change(event.target.checked)} />
        <span>Use the graphics card (hardware acceleration)</span>
      </label>
      {needsRestart && (
        <p className="muted">
          {state.isSaved ? 'The graphics card will be used again' : 'The graphics card will be turned off'} after O-BROS
          restarts.
        </p>
      )}
    </SettingsSection>
  )
}
