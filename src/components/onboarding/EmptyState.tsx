import { useState, useCallback, type DragEvent, type ReactNode } from 'react'
import { FolderOpen, GitBranch, FolderGit2 } from 'lucide-react'
import { GithubMark } from '@/components/common/GithubMark'
import { motion } from 'framer-motion'
import { useRepoStore } from '@/store/useRepoStore'
import { useUiStore } from '@/store/useUiStore'
import { Button } from '@/components/common/Button'
import { cn } from '@/lib/cn'

export function EmptyState() {
  const gitTool = useRepoStore((s) => s.gitTool)
  const ghStatus = useRepoStore((s) => s.ghStatus)
  const repos = useRepoStore((s) => s.repos)
  const addRepoByPath = useRepoStore((s) => s.addRepoByPath)
  const setActiveView = useUiStore((s) => s.setActiveView)
  const setCloneDialogOpen = useUiStore((s) => s.setCloneDialogOpen)
  const [dragActive, setDragActive] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSelect() {
    const folder = await window.gitControl.selectFolder()
    if (!folder) return
    const result = await addRepoByPath(folder)
    if (result === 'not-a-repo') setError('That folder is not a Git repository.')
    else {
      setError(null)
      setActiveView('dashboard')
    }
  }

  const onDrop = useCallback(
    async (e: DragEvent) => {
      e.preventDefault()
      setDragActive(false)
      const file = e.dataTransfer.files[0]
      const folder = file ? window.gitControl.getPathForFile(file) : null
      if (!folder) return
      const result = await addRepoByPath(folder)
      if (result === 'not-a-repo') setError('That folder is not a Git repository.')
      else {
        setError(null)
        setActiveView('dashboard')
      }
    },
    [addRepoByPath, setActiveView],
  )

  return (
    <div
      className={cn(
        'flex flex-1 flex-col items-center justify-center gap-8 rounded-xl border border-dashed border-border transition-colors',
        dragActive && 'border-accent bg-accent-muted',
      )}
      onDragOver={(e) => {
        e.preventDefault()
        setDragActive(true)
      }}
      onDragLeave={() => setDragActive(false)}
      onDrop={onDrop}
    >
      <motion.div
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col items-center gap-3 text-center"
      >
        <div className="flex size-12 items-center justify-center rounded-2xl border border-border bg-panel shadow-inner">
          <FolderGit2 className="size-5 text-accent" />
        </div>
        <h1 className="text-[22px] font-semibold tracking-tight text-text">Git Control</h1>
        <p className="max-w-xs text-[13px] leading-relaxed text-text-muted">
          Your Git workflow, visualized.
          <br />
          Select a repository to get started.
        </p>
        <div className="mt-2 flex items-center gap-2">
          <Button variant="primary" size="lg" icon={<FolderOpen className="size-4" />} onClick={handleSelect}>
            Select Folder
          </Button>
          <Button variant="secondary" size="lg" onClick={() => setCloneDialogOpen(true)}>
            Clone Repository
          </Button>
        </div>
        {error && <p className="text-[12px] text-danger">{error}</p>}
        <p className="mt-1 text-[11.5px] text-text-faint">or drag a repository folder here</p>
      </motion.div>

      <div className="flex items-center gap-5 text-[11.5px] text-text-faint">
        <Indicator ok={!!gitTool?.installed} icon={<GitBranch className="size-3" />} label="Git detected" />
        <Indicator ok={!!ghStatus?.authenticated} icon={<GithubMark className="size-3" />} label="GitHub connected" />
        <Indicator ok={repos.length > 0} icon={<FolderGit2 className="size-3" />} label={`${repos.length} repositories`} />
      </div>
    </div>
  )
}

function Indicator({ ok, icon, label }: { ok: boolean; icon: ReactNode; label: string }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cn('flex size-4 items-center justify-center rounded-full', ok ? 'text-success' : 'text-text-faint')}>
        {icon}
      </span>
      <span>{label}</span>
    </div>
  )
}
