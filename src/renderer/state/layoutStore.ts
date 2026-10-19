import { create } from 'zustand'

export type Section = 'projects' | 'history' | 'changes' | 'activity' | 'team' | 'settings'
export type SidebarMode = 'expanded' | 'rail' | 'hidden'
export type SettingsPage = 'accounts' | 'agents' | 'folders' | 'editor' | 'languageServers' | 'terminal' | 'team' | 'shortcuts' | 'storage' | 'backup' | 'about'

interface LayoutState {
  section: Section
  sidebarMode: SidebarMode
  settingsPage: SettingsPage
  isFilesPanelOpen: boolean
  isQuickOpenVisible: boolean
  isCommandPaletteVisible: boolean
  selectSection: (section: Section) => void
  openSection: (section: Section) => void
  showSection: (section: Section) => void
  toggleSidebarVisibility: () => void
  toggleFilesPanel: () => void
  openQuickOpen: () => void
  closeQuickOpen: () => void
  openCommandPalette: () => void
  closeCommandPalette: () => void
  selectSettingsPage: (page: SettingsPage) => void
}

export const useLayoutStore = create<LayoutState>()((set, get) => ({
  section: 'projects',
  sidebarMode: 'expanded',
  settingsPage: 'accounts',
  isFilesPanelOpen: false,
  isQuickOpenVisible: false,
  isCommandPaletteVisible: false,

  selectSection: (section) => {
    const { section: currentSection, sidebarMode } = get()
    const isClickingOpenSection = section === currentSection && sidebarMode === 'expanded'
    set({ section, sidebarMode: isClickingOpenSection ? 'rail' : 'expanded' })
  },

  openSection: (section) => set({ section, sidebarMode: 'expanded' }),

  showSection: (section) => set({ section }),

  toggleSidebarVisibility: () => {
    set({ sidebarMode: get().sidebarMode === 'hidden' ? 'expanded' : 'hidden' })
  },

  toggleFilesPanel: () => set({ isFilesPanelOpen: !get().isFilesPanelOpen }),

  openQuickOpen: () => set({ isQuickOpenVisible: true }),

  closeQuickOpen: () => set({ isQuickOpenVisible: false }),

  openCommandPalette: () => set({ isCommandPaletteVisible: true }),

  closeCommandPalette: () => set({ isCommandPaletteVisible: false }),

  selectSettingsPage: (settingsPage) => set({ settingsPage })
}))
