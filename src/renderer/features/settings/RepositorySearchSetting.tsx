import { useEffect, useState } from 'react'
import { friendlyErrorMessage } from '../../../shared/friendlyError'
import { REPOSITORY_SEARCH_DEPTHS } from '../../../shared/repositorySearch'
import { toast } from '../../state/toastStore'
import { SegmentedControl } from '../../ui/SegmentedControl'
import { SettingsSection } from '../../ui/SettingsSection'

export function RepositorySearchSetting() {
  const [depth, setDepth] = useState<number | null>(null)

  useEffect(() => {
    window.api.projects
      .searchDepth()
      .then(setDepth)
      .catch(() => setDepth(null))
  }, [])

  async function change(nextDepth: number): Promise<void> {
    try {
      await window.api.projects.setSearchDepth(nextDepth)
      setDepth(nextDepth)
    } catch (error) {
      toast.error(friendlyErrorMessage(error, 'Could not save the setting.'))
    }
  }

  if (depth === null) {
    return null
  }

  return (
    <SettingsSection
      title="How deep to look for repositories"
      description={
        <>
          The Git page lists the repositories inside your project folders, up to this many folder levels down. 3 finds{' '}
          <span className="mono">C:\xampp\htdocs\app</span>; 5 also finds <span className="mono">C:\Users\you\source\repos\app</span>.
          Deeper searches of a whole drive take longer, and each search stops after 20 seconds or 100 repositories.
        </>
      }
    >
      <SegmentedControl
        className="settings-segmented"
        options={REPOSITORY_SEARCH_DEPTHS.map((value) => ({ value, label: value === 1 ? '1 level' : `${value} levels` }))}
        value={depth}
        onChange={(value) => void change(value)}
      />
    </SettingsSection>
  )
}
