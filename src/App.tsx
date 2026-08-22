import { useEffect } from 'react'
import { useRepoStore } from '@/store/useRepoStore'
import { useKeyboardShortcuts } from '@/hooks/useKeyboardShortcuts'
import { TitleBar } from '@/components/layout/TitleBar'
import { Sidebar } from '@/components/layout/Sidebar'
import { MainContent } from '@/components/layout/MainContent'
import { DiffViewer } from '@/components/diff/DiffViewer'
import { CommandPalette } from '@/components/palette/CommandPalette'
import { CloneDialog } from '@/components/onboarding/CloneDialog'
import { TerminalDrawer } from '@/components/terminal/TerminalDrawer'
import { ErrorToast } from '@/components/common/ErrorToast'

function App() {
  const init = useRepoStore((s) => s.init)
  const gitTool = useRepoStore((s) => s.gitTool)
  useKeyboardShortcuts()

  useEffect(() => {
    init()
  }, [init])

  return (
    <div className="flex h-screen flex-col bg-bg">
      <TitleBar />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <MainContent />
          <TerminalDrawer />
        </div>
      </div>

      {gitTool === null && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-bg">
          <div className="size-5 animate-spin rounded-full border-2 border-border border-t-accent" />
        </div>
      )}

      <DiffViewer />
      <CommandPalette />
      <CloneDialog />
      <ErrorToast />
    </div>
  )
}

export default App
