import { Activity } from 'lucide-react'
import { countByHour, summarizeToday, timeByAgent } from '../../../../shared/activityStats'
import { StatusDot } from '../../../ui/StatusDot'
import { LoadingText } from '../../../ui/LoadingText'
import { useNow } from '../../../ui/useNow'
import { useActivityFeed } from '../useActivityFeed'
import { ActivityLog } from './ActivityLog'
import { AgentTimeBars } from './AgentTimeBars'
import { HourlyChart } from './HourlyChart'
import { LiveAgentCards } from './LiveAgentCards'
import { TodayTiles } from './TodayTiles'
import { useLiveAgents } from './useLiveAgents'
import './activityMonitor.css'

const REFRESH_MS = 30_000

function RunningSummary({ running, working, waiting }: { running: number; working: number; waiting: number }) {
  return (
    <span className="monitor-pulse">
      <StatusDot tone={working > 0 ? 'info' : 'neutral'} isPulsing={working > 0} />
      {running === 0
        ? 'No agents running'
        : `${running} running · ${working} working${waiting > 0 ? ` · ${waiting} waiting for you` : ''}`}
    </span>
  )
}

export function ActivityMonitor() {
  const entries = useActivityFeed() ?? []
  const live = useLiveAgents()
  const now = useNow(REFRESH_MS)
  const liveAgents = live ?? []

  return (
    <div className="activity-monitor">
      <header className="monitor-header">
        <span className="monitor-title">
          <Activity size={18} /> Agent monitor
        </span>
        <RunningSummary
          running={liveAgents.length}
          working={liveAgents.filter((agent) => agent.state === 'working').length}
          waiting={liveAgents.filter((agent) => agent.state === 'waiting').length}
        />
      </header>

      <section className="monitor-section">
        <h2 className="monitor-section-title">Running now</h2>
        {live === null ? <p className="monitor-empty"><LoadingText text="Looking for running agents…" /></p> : <LiveAgentCards agents={liveAgents} />}
      </section>

      <section className="monitor-section">
        <h2 className="monitor-section-title">Today</h2>
        <TodayTiles summary={summarizeToday(entries, liveAgents, now)} />
      </section>

      <div className="monitor-columns">
        <HourlyChart counts={countByHour(entries, now)} currentHour={new Date(now).getHours()} />
        <AgentTimeBars agents={timeByAgent(entries, liveAgents, now)} />
      </div>

      <ActivityLog entries={entries} now={now} />
    </div>
  )
}
