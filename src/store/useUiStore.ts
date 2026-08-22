import { create } from 'zustand'

export type ViewId = 'dashboard' | 'branches' | 'history' | 'stash' | 'github' | 'settings'

interface UiState {
  activeView: ViewId
  setActiveView: (view: ViewId) => void

  commandPaletteOpen: boolean
  setCommandPaletteOpen: (open: boolean) => void
  paletteMode: 'commands' | 'repos'
  setPaletteMode: (mode: 'commands' | 'repos') => void
  openPalette: (mode: 'commands' | 'repos') => void

  terminalOpen: boolean
  setTerminalOpen: (open: boolean) => void
  toggleTerminal: () => void

  selectedFile: { path: string; staged: boolean } | null
  setSelectedFile: (file: { path: string; staged: boolean } | null) => void

  selectedCommitHash: string | null
  setSelectedCommitHash: (hash: string | null) => void

  cloneDialogOpen: boolean
  setCloneDialogOpen: (open: boolean) => void
}

export const useUiStore = create<UiState>((set) => ({
  activeView: 'dashboard',
  setActiveView: (view) => set({ activeView: view }),

  commandPaletteOpen: false,
  setCommandPaletteOpen: (open) => set({ commandPaletteOpen: open }),
  paletteMode: 'commands',
  setPaletteMode: (mode) => set({ paletteMode: mode }),
  openPalette: (mode) => set({ commandPaletteOpen: true, paletteMode: mode }),

  terminalOpen: false,
  setTerminalOpen: (open) => set({ terminalOpen: open }),
  toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),

  selectedFile: null,
  setSelectedFile: (file) => set({ selectedFile: file }),

  selectedCommitHash: null,
  setSelectedCommitHash: (hash) => set({ selectedCommitHash: hash }),

  cloneDialogOpen: false,
  setCloneDialogOpen: (open) => set({ cloneDialogOpen: open }),
}))
