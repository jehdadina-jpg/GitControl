import { useEffect } from 'react'
import { useUiStore } from '@/store/useUiStore'
import { useRepoStore } from '@/store/useRepoStore'

export function useKeyboardShortcuts() {
  const setCommandPaletteOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const commandPaletteOpen = useUiStore((s) => s.commandPaletteOpen)
  const openPalette = useUiStore((s) => s.openPalette)
  const doFetch = useRepoStore((s) => s.doFetch)
  const doPull = useRepoStore((s) => s.doPull)
  const doPush = useRepoStore((s) => s.doPush)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const mod = e.ctrlKey || e.metaKey
      if (!mod) return

      if (e.shiftKey && e.key.toLowerCase() === 'p') {
        e.preventDefault()
        if (commandPaletteOpen) setCommandPaletteOpen(false)
        else openPalette('commands')
        return
      }
      if (e.key.toLowerCase() === 'p' && !e.shiftKey) {
        e.preventDefault()
        openPalette('repos')
        return
      }
      if (e.shiftKey && e.key.toLowerCase() === 'f') {
        e.preventDefault()
        doFetch()
        return
      }
      if (e.shiftKey && e.key.toLowerCase() === 'u') {
        e.preventDefault()
        doPush()
        return
      }
      if (e.shiftKey && e.key.toLowerCase() === 'd') {
        e.preventDefault()
        doPull()
        return
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [commandPaletteOpen, setCommandPaletteOpen, openPalette, doFetch, doPull, doPush])
}
