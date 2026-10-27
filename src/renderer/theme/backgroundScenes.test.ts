import { describe, expect, it } from 'vitest'
import { SCENE_IDS } from '../../shared/appearance'
import { sceneImage } from './backgroundScenes'
import { findColorTheme } from './colorThemes'

describe('sceneImage', () => {
  it('paints every scene with the colors of the chosen theme', () => {
    const dracula = findColorTheme('dracula')!
    const blue = dracula.ansi[4].toLowerCase()
    const red = Number.parseInt(blue.slice(1, 3), 16)
    expect(sceneImage('glow', dracula)).toContain(`rgba(${red}, `)
    for (const scene of SCENE_IDS) {
      expect(sceneImage(scene, dracula)).toContain('gradient(')
    }
  })

  it('stays softer on light themes', () => {
    const dark = findColorTheme('o-bros')!
    const light = findColorTheme('o-bros-light')!
    expect(sceneImage('glow', dark)).toContain(', 0.45)')
    expect(sceneImage('glow', light)).toContain(', 0.27)')
  })
})
