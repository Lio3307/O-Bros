import { Bot } from 'lucide-react'
import { useEffect } from 'react'
import { programKeyOf, useAgentCatalogStore } from '../state/agentCatalogStore'
import './agentIcon.css'

export function AgentIcon({ command, size = 14 }: { command: string; size?: number }) {
  const program = programKeyOf(command)
  const logo = useAgentCatalogStore((state) => state.logoByProgram[program])
  const loadLogo = useAgentCatalogStore((state) => state.loadLogo)

  useEffect(() => {
    if (logo === undefined) {
      void loadLogo(program)
    }
  }, [program, logo, loadLogo])

  if (logo === undefined || logo === null) {
    return <Bot size={size} />
  }
  if (logo.style === 'color') {
    return <img className="agent-logo-image" src={logo.dataUrl} alt="" width={size} height={size} draggable={false} />
  }
  return (
    <span
      className="agent-logo-mask"
      role="img"
      aria-hidden="true"
      style={{ width: size, height: size, maskImage: `url("${logo.dataUrl}")`, WebkitMaskImage: `url("${logo.dataUrl}")` }}
    />
  )
}
