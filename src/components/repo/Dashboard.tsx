import { useState } from 'react'
import { useRepoStore } from '@/store/useRepoStore'
import { useUiStore } from '@/store/useUiStore'
import { RepoHeader } from './RepoHeader'
import { ActionsGrid, actionIcons } from './ActionsGrid'
import { ChangesPanel } from '@/components/changes/ChangesPanel'
import { CommitGraph } from '@/components/graph/CommitGraph'
import { CreateBranchDialog } from '@/components/branches/CreateBranchDialog'
import { CreatePrDialog } from '@/components/github/CreatePrDialog'
import { PullConfirmDialog, PushConfirmDialog, MergeQuickDialog, RebaseQuickDialog } from './QuickDialogs'

export function Dashboard() {
  const status = useRepoStore((s) => s.status)
  const commits = useRepoStore((s) => s.commits)
  const doFetch = useRepoStore((s) => s.doFetch)
  const loading = useRepoStore((s) => s.loading)
  const setActiveView = useUiStore((s) => s.setActiveView)

  const [pullOpen, setPullOpen] = useState(false)
  const [pushOpen, setPushOpen] = useState(false)
  const [mergeOpen, setMergeOpen] = useState(false)
  const [rebaseOpen, setRebaseOpen] = useState(false)
  const [branchOpen, setBranchOpen] = useState(false)
  const [prOpen, setPrOpen] = useState(false)

  const syncBusy = loading.fetch || loading.pull || loading.push

  const actions = [
    { key: 'pull', label: 'Pull', icon: actionIcons.pull, onClick: () => setPullOpen(true), badge: status?.behind, disabled: syncBusy },
    { key: 'push', label: 'Push', icon: actionIcons.push, onClick: () => setPushOpen(true), badge: status?.ahead, disabled: syncBusy },
    { key: 'fetch', label: 'Fetch', icon: actionIcons.fetch, onClick: () => doFetch(), disabled: syncBusy },
    {
      key: 'commit',
      label: 'Commit',
      icon: actionIcons.commit,
      onClick: () => document.querySelector<HTMLTextAreaElement>('textarea[placeholder="What changed?"]')?.focus(),
    },
    { key: 'merge', label: 'Merge', icon: actionIcons.merge, onClick: () => setMergeOpen(true), disabled: loading.merge || loading.rebase },
    { key: 'branch', label: 'Branch', icon: actionIcons.branch, onClick: () => setBranchOpen(true) },
    { key: 'stash', label: 'Stash', icon: actionIcons.stash, onClick: () => setActiveView('stash') },
    { key: 'rebase', label: 'Rebase', icon: actionIcons.rebase, onClick: () => setRebaseOpen(true), disabled: loading.merge || loading.rebase },
    { key: 'pr', label: 'Pull Request', icon: actionIcons.pr, onClick: () => setPrOpen(true) },
  ]

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <RepoHeader />

      <div className="grid grid-cols-2 gap-4 px-6">
        <ChangesPanel />
        <div className="rounded-xl border border-border bg-panel p-4">
          <p className="mb-3 text-[11px] font-semibold tracking-wide text-text-faint">ACTIONS</p>
          <ActionsGrid actions={actions} />
        </div>
      </div>

      <div className="mx-6 mt-4 rounded-xl border border-border bg-panel p-4">
        <p className="mb-3 text-[11px] font-semibold tracking-wide text-text-faint">GRAPH &amp; RECENT COMMITS</p>
        <CommitGraph commits={commits} limit={10} />
      </div>

      <div className="h-4" />

      <PullConfirmDialog open={pullOpen} onClose={() => setPullOpen(false)} />
      <PushConfirmDialog open={pushOpen} onClose={() => setPushOpen(false)} />
      <MergeQuickDialog open={mergeOpen} onClose={() => setMergeOpen(false)} />
      <RebaseQuickDialog open={rebaseOpen} onClose={() => setRebaseOpen(false)} />
      <CreateBranchDialog open={branchOpen} onClose={() => setBranchOpen(false)} />
      <CreatePrDialog open={prOpen} onClose={() => setPrOpen(false)} />
    </div>
  )
}
