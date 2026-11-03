import { Check } from 'lucide-react'
import { handoffInto, useHandoffStore, type Handoff, type HandoffStep } from '../../state/handoffStore'
import { AgentIcon } from '../../ui/AgentIcon'
import './handoffCard.css'

const STEPS: HandoffStep[] = ['reading', 'opening', 'sending', 'done']

function stepText({ step, toName, note }: Handoff): string {
  const texts: Record<HandoffStep, string> = {
    reading: 'Reading the conversation and writing a recap',
    opening: `Opening ${toName} in a new tab`,
    sending: `Waiting for ${toName} to start, then sending the recap`,
    done: `${toName} has the recap and carries on.${note}`
  }
  return texts[step]
}

function HandoffRoute({ handoff }: { handoff: Handoff }) {
  return (
    <div className="handoff-route" aria-hidden="true">
      <AgentIcon command={handoff.fromProvider} size={18} />
      <span className="handoff-track">
        <span className="handoff-packet" />
      </span>
      <span className="handoff-target">
        <AgentIcon command={handoff.toCommand} size={18} />
        {handoff.step === 'done' && <Check className="handoff-check" size={10} strokeWidth={3} />}
      </span>
    </div>
  )
}

export function HandoffCard() {
  const handoff = useHandoffStore((state) => state.handoff)
  if (handoff === null || handoff.step === 'sending') {
    return null
  }
  const isDone = handoff.step === 'done'
  const reached = STEPS.indexOf(handoff.step)

  return (
    <div className="handoff-card" role="status" data-step={handoff.step}>
      <HandoffRoute handoff={handoff} />
      <div className="handoff-text">
        <span className="handoff-title">{isDone ? `Handed off to ${handoff.toName}` : `Handing off to ${handoff.toName}`}</span>
        <span className="muted handoff-step">{stepText(handoff)}</span>
      </div>
      <span className="handoff-progress" aria-hidden="true">
        {STEPS.slice(0, -1).map((step, index) => (
          <span key={step} className={index < reached || isDone ? 'handoff-tick handoff-tick-done' : index === reached ? 'handoff-tick handoff-tick-now' : 'handoff-tick'} />
        ))}
      </span>
    </div>
  )
}

export function HandoffPaneOverlay({ paneId }: { paneId: string }) {
  const handoff = useHandoffStore((state) => handoffInto(state.handoff, paneId))
  if (handoff === null) {
    return null
  }
  return (
    <div className="handoff-overlay" role="status">
      <div className="handoff-overlay-box">
        <HandoffRoute handoff={handoff} />
        <span className="handoff-title">Handing off to {handoff.toName}</span>
        <span className="muted handoff-step">{stepText(handoff)}. You can type here once it is in.</span>
      </div>
    </div>
  )
}
