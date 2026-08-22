import { useState } from 'react'
import { GitCommitHorizontal, ArrowUp } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { Button } from '@/components/common/Button'

export function CommitBox() {
  const [message, setMessage] = useState('')
  const status = useRepoStore((s) => s.status)
  const loading = useRepoStore((s) => s.loading.commit)
  const doCommit = useRepoStore((s) => s.doCommit)

  const stagedCount = status?.files.filter((f) => f.staged).length ?? 0
  const canCommit = message.trim().length > 0 && stagedCount > 0 && !loading

  async function handleCommit(push: boolean) {
    if (!canCommit) return
    const ok = await doCommit(message.trim(), null, push)
    if (ok) setMessage('')
  }

  return (
    <div className="border-t border-border p-3">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
            e.preventDefault()
            handleCommit(false)
          }
        }}
        placeholder="What changed?"
        rows={2}
        className="w-full resize-none rounded-lg border border-border bg-bg-elevated px-3 py-2 text-[13px] text-text placeholder:text-text-faint focus:border-accent/60 focus:outline-none"
      />
      <div className="mt-2 flex items-center justify-between">
        <span className="text-[11.5px] text-text-faint">
          {stagedCount > 0 ? `${stagedCount} file${stagedCount === 1 ? '' : 's'} staged` : 'No files staged'}
        </span>
        <div className="flex gap-2">
          <Button
            variant="secondary"
            size="sm"
            icon={<GitCommitHorizontal className="size-3.5" />}
            disabled={!canCommit}
            loading={loading}
            onClick={() => handleCommit(false)}
          >
            Commit
          </Button>
          <Button
            variant="primary"
            size="sm"
            icon={<ArrowUp className="size-3.5" />}
            disabled={!canCommit}
            loading={loading}
            onClick={() => handleCommit(true)}
          >
            Commit &amp; Push
          </Button>
        </div>
      </div>
    </div>
  )
}
