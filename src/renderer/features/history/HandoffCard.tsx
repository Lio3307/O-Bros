import { Check } from 'lucide-react'
import { useHandoffStore, type Handoff, type HandoffStep } from '../../state/handoffStore'
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

export function HandoffCard() {
  const handoff = useHandoffStore((state) => state.handoff)
  if (handoff === null) {
    return null
  }
  const isDone = handoff.step === 'done'
  const reached = STEPS.indexOf(handoff.step)

  return (
    <div className="handoff-card" role="status" data-step={handoff.step}>
      <div className="handoff-route" aria-hidden="true">
        <AgentIcon command={handoff.fromProvider} size={18} />
        <span className="handoff-track">
          <span className="handoff-packet" />
        </span>
        <span className="handoff-target">
          <AgentIcon command={handoff.toCommand} size={18} />
          {isDone && <Check className="handoff-check" size={10} strokeWidth={3} />}
        </span>
      </div>
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
