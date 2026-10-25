import { friendlyErrorMessage } from '../../../../shared/friendlyError'
import { MAX_THEME_FILE_CHARACTERS, palettesFromThemeFile, type ThemeFile } from '../../../../shared/themeImport'
import { themeIdOf, type ThemePalette } from '../../../../shared/themePalette'
import { IMPORTED_THEME_PREFIX, useColorThemeStore } from '../../../state/colorThemeStore'
import { toast } from '../../../state/toastStore'
import { themeFromPalette, isDarkTheme } from '../../../theme/themeDerivation'

const MAX_PICKED_FILES = 50
const FALLBACK_ID = 'theme'

function palettesFromFiles(files: ThemeFile[]): ThemePalette[] {
  const byId = new Map<string, ThemePalette>()
  for (const file of files) {
    for (const palette of palettesFromThemeFile(file.content, file.name)) {
      const id = `${IMPORTED_THEME_PREFIX}${themeIdOf(palette.label) || FALLBACK_ID}`
      byId.set(id, { ...palette, id })
    }
  }
  return [...byId.values()]
}

function themeCountText(count: number): string {
  return count === 1 ? '1 theme' : `${count} themes`
}

function keepImportedPalettes(palettes: ThemePalette[], source: string): void {
  const store = useColorThemeStore.getState()
  store.importPalettes(palettes)
  if (palettes.length === 1) {
    const [palette] = palettes
    const isDark = isDarkTheme(themeFromPalette(palette))
    if (isDark) {
      store.setDarkTheme(palette.id)
    } else {
      store.setLightTheme(palette.id)
    }
    if (store.mode !== 'system') {
      store.setMode(isDark ? 'dark' : 'light')
    }
    toast.success(`Imported ${palette.label} ${source} and picked it.`)
    return
  }
  toast.success(`Imported ${themeCountText(palettes.length)} ${source}.`)
}

export async function importThemesFromWarp(): Promise<void> {
  try {
    const result = await window.api.appearance.readWarpThemes()
    if (result.folders.length === 0) {
      toast.info(`Warp's themes folder was not found. O-BROS looked in ${result.searched.join(' and ')}.`)
      return
    }
    const palettes = palettesFromFiles(result.files)
    if (palettes.length === 0) {
      toast.info(`No theme O-BROS can read was found in ${result.folders.join(' and ')}.`)
      return
    }
    keepImportedPalettes(palettes, 'from Warp')
  } catch (error) {
    toast.error(friendlyErrorMessage(error, 'Could not read the Warp themes.'))
  }
}

export async function importThemeFiles(fileList: FileList | null): Promise<void> {
  const picked = Array.from(fileList ?? []).slice(0, MAX_PICKED_FILES)
  const readable = picked.filter((file) => file.size <= MAX_THEME_FILE_CHARACTERS)
  const files = await Promise.all(readable.map(async (file) => ({ name: file.name, content: await file.text() })))
  const palettes = palettesFromFiles(files)
  if (palettes.length === 0) {
    toast.error('That file is not a theme O-BROS can read. Use a Warp or Alacritty YAML theme, or a Windows Terminal color scheme.')
    return
  }
  keepImportedPalettes(palettes, 'from the file')
}
