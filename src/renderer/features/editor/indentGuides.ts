import { indentationMarkers } from '@replit/codemirror-indentation-markers'
import type { Extension } from '@codemirror/state'
import type { ColorTheme } from '../../theme/colorThemes'

function mixed(color: string, percent: number): string {
  return `color-mix(in srgb, ${color} ${percent}%, transparent)`
}

export function indentGuides(theme: ColorTheme): Extension {
  const guide = mixed(theme.code.comment, 28)
  const currentBlock = mixed(theme.code.functionName, 75)
  return indentationMarkers({
    highlightActiveBlock: true,
    markerType: 'fullScope',
    thickness: 1,
    colors: { light: guide, dark: guide, activeLight: currentBlock, activeDark: currentBlock }
  })
}
