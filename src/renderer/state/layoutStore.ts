import { create } from 'zustand'

export type Section = 'projects' | 'history' | 'changes' | 'settings'
export type SidebarMode = 'expanded' | 'rail' | 'hidden'
export type SettingsPage = 'accounts' | 'agents' | 'folders' | 'editor' | 'snippets' | 'terminal' | 'shortcuts' | 'storage' | 'about'

interface LayoutState {
  section: Section
  sidebarMode: SidebarMode
  settingsPage: SettingsPage
  isFilesPanelOpen: boolean
  isQuickOpenVisible: boolean
  selectSection: (section: Section) => void
  openSection: (section: Section) => void
  showSection: (section: Section) => void
  toggleSidebarVisibility: () => void
  toggleFilesPanel: () => void
  openQuickOpen: () => void
  closeQuickOpen: () => void
  selectSettingsPage: (page: SettingsPage) => void
}

export const useLayoutStore = create<LayoutState>()((set, get) => ({
  section: 'projects',
  sidebarMode: 'expanded',
  settingsPage: 'accounts',
  isFilesPanelOpen: false,
  isQuickOpenVisible: false,

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

  selectSettingsPage: (settingsPage) => set({ settingsPage })
}))
