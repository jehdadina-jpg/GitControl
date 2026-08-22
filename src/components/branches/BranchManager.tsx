import { useState, type ReactNode } from 'react'
import { GitBranch, Plus, MoreHorizontal, Check, Trash2, GitMerge, ArrowUpFromLine, Pencil } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { Button } from '@/components/common/Button'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { Modal } from '@/components/common/Modal'
import { CreateBranchDialog } from './CreateBranchDialog'
import { relativeTime } from '@/lib/format'
import { cn } from '@/lib/cn'
import type { BranchInfo } from '@/types/git'

export function BranchManager() {
  const branches = useRepoStore((s) => s.branches)
  const checkoutBranch = useRepoStore((s) => s.checkoutBranch)
  const deleteBranch = useRepoStore((s) => s.deleteBranch)
  const mergeBranch = useRepoStore((s) => s.mergeBranch)
  const rebaseBranch = useRepoStore((s) => s.rebaseBranch)
  const pushBranch = useRepoStore((s) => s.pushBranch)

  const [createOpen, setCreateOpen] = useState(false)
  const [menuFor, setMenuFor] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<string | null>(null)
  const [mergeTarget, setMergeTarget] = useState<string | null>(null)
  const [rebaseTarget, setRebaseTarget] = useState<string | null>(null)
  const [renameTarget, setRenameTarget] = useState<BranchInfo | null>(null)
  const [renameValue, setRenameValue] = useState('')

  if (!branches) return null

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center justify-between">
        <h2 className="text-[13px] font-semibold text-text">Branches</h2>
        <Button variant="primary" size="sm" icon={<Plus className="size-3.5" />} onClick={() => setCreateOpen(true)}>
          New Branch
        </Button>
      </div>

      <Section title="CURRENT">
        {branches.local
          .filter((b) => b.current)
          .map((b) => (
            <BranchRow key={b.name} branch={b} current onMenu={() => {}} />
          ))}
      </Section>

      <Section title="LOCAL">
        {branches.local
          .filter((b) => !b.current)
          .map((b) => (
            <BranchRow
              key={b.name}
              branch={b}
              menuOpen={menuFor === b.name}
              onMenu={() => setMenuFor(menuFor === b.name ? null : b.name)}
              onCloseMenu={() => setMenuFor(null)}
              actions={[
                { icon: <Check className="size-3.5" />, label: 'Checkout', onClick: () => checkoutBranch(b.name) },
                { icon: <GitMerge className="size-3.5" />, label: 'Merge into current', onClick: () => setMergeTarget(b.name) },
                { icon: <ArrowUpFromLine className="size-3.5" />, label: 'Rebase current onto this', onClick: () => setRebaseTarget(b.name) },
                { icon: <Pencil className="size-3.5" />, label: 'Rename', onClick: () => { setRenameTarget(b); setRenameValue(b.name) } },
                { icon: <ArrowUpFromLine className="size-3.5" />, label: 'Push branch', onClick: () => pushBranch(b.name) },
                { icon: <Trash2 className="size-3.5" />, label: 'Delete', danger: true, onClick: () => setDeleteTarget(b.name) },
              ]}
            />
          ))}
      </Section>

      <Section title="REMOTE">
        {branches.remote.map((b) => (
          <BranchRow key={b.name} branch={b} remote onMenu={() => {}} />
        ))}
      </Section>

      <CreateBranchDialog open={createOpen} onClose={() => setCreateOpen(false)} />

      <ConfirmDialog
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={() => {
          if (deleteTarget) deleteBranch(deleteTarget, false)
          setDeleteTarget(null)
        }}
        title="Delete branch?"
        description={`"${deleteTarget}" will be deleted. Unmerged commits may be lost.`}
        confirmLabel="Delete Branch"
      />

      <ConfirmDialog
        open={!!mergeTarget}
        onClose={() => setMergeTarget(null)}
        onConfirm={() => {
          if (mergeTarget) mergeBranch(mergeTarget)
          setMergeTarget(null)
        }}
        title="Merge branch"
        description={`Merge "${mergeTarget}" into "${branches.current}". This creates a merge commit if the branches have diverged.`}
        confirmLabel="Merge"
        danger={false}
      />

      <ConfirmDialog
        open={!!rebaseTarget}
        onClose={() => setRebaseTarget(null)}
        onConfirm={() => {
          if (rebaseTarget) rebaseBranch(rebaseTarget)
          setRebaseTarget(null)
        }}
        title={`Rebase ${branches.current}`}
        description={`Rebase "${branches.current}" onto "${rebaseTarget}". This will rewrite commit history.`}
        confirmLabel="I Understand, Continue"
      />

      <Modal
        open={!!renameTarget}
        onClose={() => setRenameTarget(null)}
        title="Rename branch"
        footer={
          <>
            <Button variant="ghost" onClick={() => setRenameTarget(null)}>
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={async () => {
                if (renameTarget && renameValue.trim() && renameTarget.name !== renameValue.trim()) {
                  const repoPath = useRepoStore.getState().currentRepoPath
                  if (repoPath) {
                    await window.gitControl.renameBranch(repoPath, renameTarget.name, renameValue.trim())
                    await useRepoStore.getState().refreshBranches()
                  }
                }
                setRenameTarget(null)
              }}
            >
              Rename
            </Button>
          </>
        }
      >
        <input
          autoFocus
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-mono text-[13px] text-text focus:border-accent/60 focus:outline-none"
        />
      </Modal>
    </div>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  const items = Array.isArray(children) ? children : [children]
  if (items.filter(Boolean).length === 0) return null
  return (
    <div>
      <p className="mb-1.5 text-[11px] font-semibold tracking-wide text-text-faint">{title}</p>
      <div className="space-y-0.5">{children}</div>
    </div>
  )
}

interface RowAction {
  icon: ReactNode
  label: string
  onClick: () => void
  danger?: boolean
}

function BranchRow({
  branch,
  current,
  remote,
  actions,
  menuOpen,
  onMenu,
  onCloseMenu,
}: {
  branch: BranchInfo
  current?: boolean
  remote?: boolean
  actions?: RowAction[]
  menuOpen?: boolean
  onMenu: () => void
  onCloseMenu?: () => void
}) {
  return (
    <div className="group relative flex items-center gap-2 rounded-lg px-2.5 py-2 hover:bg-panel-hover">
      <span
        className={cn('size-1.5 shrink-0 rounded-full', current ? 'bg-accent' : remote ? 'bg-text-faint' : 'bg-text-muted')}
      />
      <GitBranch className="size-3.5 shrink-0 text-text-faint" />
      <span className="min-w-0 flex-1 truncate text-mono text-[13px] text-text">{branch.name}</span>
      {(branch.ahead > 0 || branch.behind > 0) && (
        <span className="shrink-0 text-mono text-[11px] text-text-faint">
          {branch.ahead > 0 && `↑${branch.ahead}`} {branch.behind > 0 && `↓${branch.behind}`}
        </span>
      )}
      {branch.lastCommitDate && (
        <span className="hidden shrink-0 text-[11px] text-text-faint sm:block">{relativeTime(branch.lastCommitDate)}</span>
      )}
      {actions && (
        <div className="relative">
          <button
            onClick={onMenu}
            className="rounded p-1 text-text-faint opacity-0 hover:bg-panel hover:text-text group-hover:opacity-100"
          >
            <MoreHorizontal className="size-3.5" />
          </button>
          {menuOpen && (
            <div
              className="absolute right-0 top-7 z-20 w-52 animate-scale-in rounded-lg border border-border bg-panel py-1 shadow-xl shadow-black/40"
              onMouseLeave={onCloseMenu}
            >
              {actions.map((action) => (
                <button
                  key={action.label}
                  onClick={() => {
                    action.onClick()
                    onCloseMenu?.()
                  }}
                  className={cn(
                    'flex w-full items-center gap-2 px-3 py-1.5 text-left text-[12px] hover:bg-panel-hover',
                    action.danger ? 'text-danger' : 'text-text-muted hover:text-text',
                  )}
                >
                  {action.icon} {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
