import { useEffect, useState } from 'react'
import { AlertTriangle, ArrowUp, CheckCircle2 } from 'lucide-react'
import { Modal } from '@/components/common/Modal'
import { ConfirmDialog } from '@/components/common/ConfirmDialog'
import { ProgressBar } from '@/components/common/ProgressBar'
import { Button } from '@/components/common/Button'
import { useRepoStore } from '@/store/useRepoStore'

type SyncPhase = 'confirm' | 'running' | 'success'

export function PullConfirmDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useRepoStore((s) => s.status)
  const doPull = useRepoStore((s) => s.doPull)
  const [phase, setPhase] = useState<SyncPhase>('confirm')
  const [conflict, setConflict] = useState<string[] | null>(null)

  useEffect(() => {
    if (open) {
      setPhase('confirm')
      setConflict(null)
    }
  }, [open])

  async function handlePull() {
    setPhase('running')
    const result = await doPull()
    if (!result.ok) {
      setPhase('confirm')
      if (result.conflicted && result.conflicted.length > 0) setConflict(result.conflicted)
      return
    }
    setPhase('success')
    setTimeout(onClose, 900)
  }

  if (conflict) {
    return (
      <Modal open={open} onClose={() => { setConflict(null); onClose() }} title="Merge conflict">
        <div className="flex gap-3">
          <div className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-full bg-danger-muted">
            <AlertTriangle className="size-4 text-danger" />
          </div>
          <div>
            <p className="text-[13px] text-text">{conflict.length} file{conflict.length === 1 ? '' : 's'} need attention.</p>
            <ul className="mt-2 space-y-1 text-mono text-[12px] text-text-muted">
              {conflict.map((f) => (
                <li key={f}>{f}</li>
              ))}
            </ul>
          </div>
        </div>
      </Modal>
    )
  }

  if (phase !== 'confirm') {
    return (
      <Modal open={open} onClose={onClose} title="">
        {phase === 'running' ? (
          <ProgressBar label="Pulling…" sublabel={status?.upstream ?? 'origin'} />
        ) : (
          <SuccessState label="Pulled successfully" />
        )}
      </Modal>
    )
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handlePull}
      title={`Pull from ${status?.upstream ?? 'origin'}?`}
      description={
        status?.behind
          ? `${status.behind} commit${status.behind === 1 ? '' : 's'} will be pulled into ${status.branch ?? 'this branch'}.`
          : 'Your branch is already up to date, but Git Control will still check for changes.'
      }
      confirmLabel="Pull"
      danger={false}
    />
  )
}

export function PushConfirmDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const status = useRepoStore((s) => s.status)
  const doPush = useRepoStore((s) => s.doPush)
  const [phase, setPhase] = useState<SyncPhase>('confirm')

  useEffect(() => {
    if (open) setPhase('confirm')
  }, [open])

  async function handlePush() {
    setPhase('running')
    const ok = await doPush(status?.upstream ? undefined : { setUpstream: status?.branch ?? undefined })
    if (!ok) {
      setPhase('confirm')
      return
    }
    setPhase('success')
    setTimeout(onClose, 900)
  }

  if (phase !== 'confirm') {
    return (
      <Modal open={open} onClose={onClose} title="">
        {phase === 'running' ? (
          <ProgressBar label="Pushing…" sublabel={status?.upstream ?? `origin/${status?.branch ?? ''}`} />
        ) : (
          <SuccessState label="Pushed successfully" />
        )}
      </Modal>
    )
  }

  return (
    <ConfirmDialog
      open={open}
      onClose={onClose}
      onConfirm={handlePush}
      title={`Push to ${status?.upstream ?? `origin/${status?.branch ?? ''}`}?`}
      description={
        status?.ahead
          ? `${status.ahead} commit${status.ahead === 1 ? '' : 's'} will be pushed.`
          : 'There are no local commits ahead of the remote, but Git Control will still attempt to push.'
      }
      confirmLabel="Push"
      danger={false}
    />
  )
}

function SuccessState({ label }: { label: string }) {
  return (
    <div className="flex flex-col items-center gap-2 py-2">
      <CheckCircle2 className="size-6 text-success" />
      <p className="text-[13px] font-medium text-text">{label}</p>
    </div>
  )
}

export function MergeQuickDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const branches = useRepoStore((s) => s.branches)
  const mergeBranch = useRepoStore((s) => s.mergeBranch)
  const loading = useRepoStore((s) => s.loading.merge)
  const [source, setSource] = useState('')

  const options = branches?.local.filter((b) => !b.current) ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Merge branch"
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="primary"
            disabled={!source}
            loading={loading}
            onClick={async () => {
              const ok = await mergeBranch(source)
              if (ok) onClose()
            }}
          >
            Merge
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-[13px]">
        <div>
          <p className="mb-1 text-[11px] font-medium text-text-faint">MERGE</p>
          <select
            value={source}
            onChange={(e) => setSource(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-mono text-[13px] text-text focus:border-accent/60 focus:outline-none"
          >
            <option value="">Select a branch…</option>
            {options.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <p className="text-text-muted">
          into <span className="text-mono text-text">{branches?.current}</span>
        </p>
      </div>
    </Modal>
  )
}

export function RebaseQuickDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const branches = useRepoStore((s) => s.branches)
  const rebaseBranch = useRepoStore((s) => s.rebaseBranch)
  const loading = useRepoStore((s) => s.loading.rebase)
  const [onto, setOnto] = useState('')

  const options = branches?.local.filter((b) => !b.current) ?? []

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Rebase ${branches?.current ?? ''}`}
      footer={
        <>
          <Button variant="ghost" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="danger"
            disabled={!onto}
            loading={loading}
            icon={<ArrowUp className="size-3.5 rotate-45" />}
            onClick={async () => {
              const ok = await rebaseBranch(onto)
              if (ok) onClose()
            }}
          >
            I Understand, Continue
          </Button>
        </>
      }
    >
      <div className="space-y-3 text-[13px]">
        <div>
          <p className="mb-1 text-[11px] font-medium text-text-faint">ONTO</p>
          <select
            value={onto}
            onChange={(e) => setOnto(e.target.value)}
            className="w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-mono text-[13px] text-text focus:border-accent/60 focus:outline-none"
          >
            <option value="">Select a branch…</option>
            {options.map((b) => (
              <option key={b.name} value={b.name}>
                {b.name}
              </option>
            ))}
          </select>
        </div>
        <p className="flex items-center gap-1.5 text-warning">
          <AlertTriangle className="size-3.5" /> This will rewrite commit history.
        </p>
      </div>
    </Modal>
  )
}
