import { useState } from 'react'
import { FolderPlus, Pin, GitBranch, MoreHorizontal, X, DownloadCloud, Settings } from 'lucide-react'
import { useRepoStore, repoName } from '@/store/useRepoStore'
import { useUiStore } from '@/store/useUiStore'
import { cn } from '@/lib/cn'

export function Sidebar() {
  const repos = useRepoStore((s) => s.repos)
  const currentRepoPath = useRepoStore((s) => s.currentRepoPath)
  const selectRepo = useRepoStore((s) => s.selectRepo)
  const addRepoByPath = useRepoStore((s) => s.addRepoByPath)
  const togglePin = useRepoStore((s) => s.togglePin)
  const removeRepo = useRepoStore((s) => s.removeRepo)
  const setActiveView = useUiStore((s) => s.setActiveView)
  const setCloneDialogOpen = useUiStore((s) => s.setCloneDialogOpen)
  const [menuFor, setMenuFor] = useState<string | null>(null)

  async function handleAddRepo() {
    const folder = await window.gitControl.selectFolder()
    if (!folder) return
    const result = await addRepoByPath(folder)
    if (result === 'ok') setActiveView('dashboard')
  }

  return (
    <aside className="flex w-[220px] shrink-0 flex-col border-r border-border bg-bg-elevated">
      <div className="flex items-center justify-between px-3.5 pt-4 pb-2">
        <span className="text-[11px] font-semibold tracking-wide text-text-faint">REPOSITORIES</span>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {repos.length === 0 && (
          <p className="px-1.5 py-3 text-[12px] leading-relaxed text-text-faint">
            No repositories yet. Add one to get started.
          </p>
        )}
        <ul className="space-y-0.5">
          {repos.map((repo) => {
            const active = repo.path === currentRepoPath
            return (
              <li key={repo.id} className="group relative">
                <button
                  onClick={() => {
                    selectRepo(repo.path)
                    setActiveView('dashboard')
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[13px] transition-colors',
                    active ? 'bg-panel text-text' : 'text-text-muted hover:bg-panel-hover hover:text-text',
                  )}
                >
                  <GitBranch className={cn('size-3.5 shrink-0', active ? 'text-accent' : 'text-text-faint')} />
                  <span className="flex-1 truncate">{repo.name || repoName(repo.path)}</span>
                  {repo.pinned && <Pin className="size-3 shrink-0 fill-current text-text-faint" />}
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    setMenuFor(menuFor === repo.id ? null : repo.id)
                  }}
                  className="absolute right-1 top-1/2 hidden -translate-y-1/2 rounded p-1 text-text-faint hover:bg-panel-hover hover:text-text group-hover:block"
                >
                  <MoreHorizontal className="size-3.5" />
                </button>
                {menuFor === repo.id && (
                  <div
                    className="absolute right-1 top-8 z-20 w-36 animate-scale-in rounded-lg border border-border bg-panel py-1 shadow-xl shadow-black/40"
                    onMouseLeave={() => setMenuFor(null)}
                  >
                    <button
                      onClick={() => {
                        togglePin(repo.id)
                        setMenuFor(null)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-text-muted hover:bg-panel-hover hover:text-text"
                    >
                      <Pin className="size-3.5" /> {repo.pinned ? 'Unpin' : 'Pin'}
                    </button>
                    <button
                      onClick={() => {
                        removeRepo(repo.id)
                        setMenuFor(null)
                      }}
                      className="flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] text-danger hover:bg-danger-muted"
                    >
                      <X className="size-3.5" /> Remove
                    </button>
                  </div>
                )}
              </li>
            )
          })}
        </ul>
      </div>

      <div className="space-y-1 border-t border-border p-2">
        <button
          onClick={handleAddRepo}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium text-text-muted hover:bg-panel-hover hover:text-text"
        >
          <FolderPlus className="size-3.5" /> Add Repository
        </button>
        <button
          onClick={() => setCloneDialogOpen(true)}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium text-text-muted hover:bg-panel-hover hover:text-text"
        >
          <DownloadCloud className="size-3.5" /> Clone Repository
        </button>
        <button
          onClick={() => setActiveView('settings')}
          className="flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-[12.5px] font-medium text-text-muted hover:bg-panel-hover hover:text-text"
        >
          <Settings className="size-3.5" /> Settings
        </button>
      </div>
    </aside>
  )
}
