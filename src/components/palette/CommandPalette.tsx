import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { AnimatePresence, motion } from 'framer-motion'
import {
  Search,
  ArrowUp,
  ArrowDown,
  RefreshCw,
  GitCommitHorizontal,
  GitBranchPlus,
  GitPullRequest,
  Terminal,
  Code2,
  Settings,
  History,
  Archive,
  FolderGit2,
} from 'lucide-react'
import { useUiStore } from '@/store/useUiStore'
import { useRepoStore, repoName } from '@/store/useRepoStore'
import { cn } from '@/lib/cn'

interface Command {
  id: string
  label: string
  icon: ReactNode
  action: () => void
  requiresRepo?: boolean
}

export function CommandPalette() {
  const open = useUiStore((s) => s.commandPaletteOpen)
  const setOpen = useUiStore((s) => s.setCommandPaletteOpen)
  const paletteMode = useUiStore((s) => s.paletteMode)
  const setActiveView = useUiStore((s) => s.setActiveView)
  const setCloneDialogOpen = useUiStore((s) => s.setCloneDialogOpen)
  const currentRepoPath = useRepoStore((s) => s.currentRepoPath)
  const repos = useRepoStore((s) => s.repos)
  const selectRepo = useRepoStore((s) => s.selectRepo)
  const doPull = useRepoStore((s) => s.doPull)
  const doPush = useRepoStore((s) => s.doPush)
  const doFetch = useRepoStore((s) => s.doFetch)

  const [query, setQuery] = useState('')
  const [index, setIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)

  const commands = useMemo<Command[]>(
    () => [
      { id: 'push', label: 'Push', icon: <ArrowUp className="size-4" />, action: () => doPush(), requiresRepo: true },
      { id: 'pull', label: 'Pull', icon: <ArrowDown className="size-4" />, action: () => doPull(), requiresRepo: true },
      { id: 'fetch', label: 'Fetch', icon: <RefreshCw className="size-4" />, action: () => doFetch(), requiresRepo: true },
      {
        id: 'commit',
        label: 'Go to Commit',
        icon: <GitCommitHorizontal className="size-4" />,
        action: () => setActiveView('dashboard'),
        requiresRepo: true,
      },
      {
        id: 'branch',
        label: 'Branch Manager',
        icon: <GitBranchPlus className="size-4" />,
        action: () => setActiveView('branches'),
        requiresRepo: true,
      },
      {
        id: 'history',
        label: 'Commit History',
        icon: <History className="size-4" />,
        action: () => setActiveView('history'),
        requiresRepo: true,
      },
      { id: 'stash', label: 'Stashes', icon: <Archive className="size-4" />, action: () => setActiveView('stash'), requiresRepo: true },
      {
        id: 'pr',
        label: 'Create Pull Request',
        icon: <GitPullRequest className="size-4" />,
        action: () => setActiveView('github'),
        requiresRepo: true,
      },
      {
        id: 'terminal',
        label: 'Open Terminal',
        icon: <Terminal className="size-4" />,
        action: () => currentRepoPath && window.gitControl.openInTerminal(currentRepoPath),
        requiresRepo: true,
      },
      {
        id: 'vscode',
        label: 'Open in VS Code',
        icon: <Code2 className="size-4" />,
        action: () => currentRepoPath && window.gitControl.openInVsCode(currentRepoPath),
        requiresRepo: true,
      },
      { id: 'clone', label: 'Clone Repository', icon: <FolderGit2 className="size-4" />, action: () => setCloneDialogOpen(true) },
      { id: 'settings', label: 'Settings', icon: <Settings className="size-4" />, action: () => setActiveView('settings') },
    ],
    [doPush, doPull, doFetch, setActiveView, setCloneDialogOpen, currentRepoPath],
  )

  const repoCommands = useMemo<Command[]>(
    () =>
      repos.map((repo) => ({
        id: `repo:${repo.id}`,
        label: repo.name || repoName(repo.path),
        icon: <FolderGit2 className="size-4" />,
        action: () => selectRepo(repo.path),
      })),
    [repos, selectRepo],
  )

  const source = paletteMode === 'repos' ? repoCommands : commands

  const filtered = source
    .filter((c) => !c.requiresRepo || currentRepoPath)
    .filter((c) => c.label.toLowerCase().includes(query.toLowerCase()))

  useEffect(() => {
    if (open) {
      setQuery('')
      setIndex(0)
      setTimeout(() => inputRef.current?.focus(), 10)
    }
  }, [open])

  useEffect(() => {
    setIndex(0)
  }, [query])

  function run(cmd: Command) {
    cmd.action()
    setOpen(false)
  }

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 pt-[18vh] backdrop-blur-[2px]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.1 }}
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setOpen(false)
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.97, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.12, ease: [0.16, 1, 0.3, 1] }}
            className="w-full max-w-lg overflow-hidden rounded-xl border border-border bg-panel shadow-2xl shadow-black/50"
          >
            <div className="flex items-center gap-2.5 border-b border-border px-4 py-3">
              <Search className="size-4 text-text-faint" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={paletteMode === 'repos' ? 'Switch repository…' : 'Search commands…'}
                className="flex-1 bg-transparent text-[13.5px] text-text placeholder:text-text-faint focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === 'ArrowDown') {
                    e.preventDefault()
                    setIndex((i) => Math.min(i + 1, filtered.length - 1))
                  } else if (e.key === 'ArrowUp') {
                    e.preventDefault()
                    setIndex((i) => Math.max(i - 1, 0))
                  } else if (e.key === 'Enter' && filtered[index]) {
                    run(filtered[index])
                  }
                }}
              />
              <kbd className="rounded border border-border px-1.5 py-0.5 text-[10.5px] text-text-faint">ESC</kbd>
            </div>
            <div className="max-h-80 overflow-y-auto p-1.5">
              {filtered.length === 0 && (
                <p className="px-3 py-6 text-center text-[12.5px] text-text-faint">No matching commands.</p>
              )}
              {filtered.map((cmd, i) => (
                <button
                  key={cmd.id}
                  onMouseEnter={() => setIndex(i)}
                  onClick={() => run(cmd)}
                  className={cn(
                    'flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left text-[13px]',
                    i === index ? 'bg-panel-hover text-text' : 'text-text-muted',
                  )}
                >
                  <span className={i === index ? 'text-accent' : 'text-text-faint'}>{cmd.icon}</span>
                  {cmd.label}
                </button>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  )
}
