import type { ReactNode } from 'react'
import { useRepoStore } from '@/store/useRepoStore'
import { useUiStore, type ViewId } from '@/store/useUiStore'
import { EmptyState } from '@/components/onboarding/EmptyState'
import { GitSetupScreen } from '@/components/onboarding/GitSetupScreen'
import { Dashboard } from '@/components/repo/Dashboard'
import { BranchManager } from '@/components/branches/BranchManager'
import { CommitList } from '@/components/history/CommitList'
import { StashDrawer } from '@/components/stash/StashDrawer'
import { GithubPanel } from '@/components/github/GithubPanel'
import { SettingsPanel } from '@/components/settings/SettingsPanel'
import { cn } from '@/lib/cn'
import { LayoutDashboard, GitBranch, History, Archive, Terminal, Code2 } from 'lucide-react'
import { GithubMark } from '@/components/common/GithubMark'

const TABS: { id: ViewId; label: string; icon: ReactNode }[] = [
  { id: 'dashboard', label: 'Overview', icon: <LayoutDashboard className="size-3.5" /> },
  { id: 'branches', label: 'Branches', icon: <GitBranch className="size-3.5" /> },
  { id: 'history', label: 'History', icon: <History className="size-3.5" /> },
  { id: 'stash', label: 'Stash', icon: <Archive className="size-3.5" /> },
  { id: 'github', label: 'GitHub', icon: <GithubMark className="size-3.5" /> },
]

export function MainContent() {
  const gitTool = useRepoStore((s) => s.gitTool)
  const currentRepoPath = useRepoStore((s) => s.currentRepoPath)
  const activeView = useUiStore((s) => s.activeView)
  const setActiveView = useUiStore((s) => s.setActiveView)

  if (gitTool && !gitTool.installed) {
    return (
      <main className="flex flex-1 flex-col p-6">
        <GitSetupScreen />
      </main>
    )
  }

  if (!currentRepoPath) {
    return (
      <main className="flex flex-1 flex-col p-6">
        <EmptyState />
      </main>
    )
  }

  if (activeView === 'settings') {
    return (
      <main className="flex flex-1 flex-col p-6">
        <SettingsPanel />
      </main>
    )
  }

  return (
    <main className="flex flex-1 flex-col overflow-hidden">
      <div className="flex items-center gap-1 border-b border-border px-6 pt-3">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveView(tab.id)}
            className={cn(
              'flex items-center gap-1.5 rounded-t-lg px-3 py-2 text-[12.5px] font-medium transition-colors',
              activeView === tab.id
                ? 'border-b-2 border-accent text-text'
                : 'text-text-faint hover:text-text-muted',
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
        <div className="ml-auto flex items-center gap-1 pb-2">
          <button
            onClick={() => window.gitControl.openInTerminal(currentRepoPath)}
            title="Open in terminal"
            className="rounded-md p-1.5 text-text-faint hover:bg-panel-hover hover:text-text"
          >
            <Terminal className="size-3.5" />
          </button>
          <button
            onClick={() => window.gitControl.openInVsCode(currentRepoPath)}
            title="Open in VS Code"
            className="rounded-md p-1.5 text-text-faint hover:bg-panel-hover hover:text-text"
          >
            <Code2 className="size-3.5" />
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col overflow-hidden p-6 pt-4">
        {activeView === 'dashboard' && <Dashboard />}
        {activeView === 'branches' && <BranchManager />}
        {activeView === 'history' && <CommitList />}
        {activeView === 'stash' && <StashDrawer />}
        {activeView === 'github' && <GithubPanel />}
      </div>
    </main>
  )
}
