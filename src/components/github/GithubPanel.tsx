import { useState } from 'react'
import { ExternalLink, GitPullRequest, CheckCircle2 } from 'lucide-react'
import { GithubMark } from '@/components/common/GithubMark'
import { useRepoStore } from '@/store/useRepoStore'
import { Button } from '@/components/common/Button'
import { Badge } from '@/components/common/Badge'
import { CreatePrDialog } from './CreatePrDialog'

export function GithubPanel() {
  const ghStatus = useRepoStore((s) => s.ghStatus)
  const currentPr = useRepoStore((s) => s.currentPr)
  const [prOpen, setPrOpen] = useState(false)

  return (
    <div className="flex flex-1 flex-col gap-5 overflow-y-auto rounded-xl border border-border bg-panel p-5">
      <div className="flex items-center gap-2.5">
        <GithubMark className="size-4 text-text-muted" />
        <h2 className="text-[13px] font-semibold text-text">GitHub</h2>
      </div>

      {!ghStatus?.installed && (
        <div className="rounded-lg border border-border bg-bg-elevated p-4">
          <p className="text-[13px] text-text">GitHub CLI not detected</p>
          <p className="mt-1 text-[12px] leading-relaxed text-text-muted">
            Install the GitHub CLI to create pull requests and view PR status from Git Control. Local Git
            functionality works fine without it.
          </p>
          <Button
            variant="secondary"
            size="sm"
            className="mt-3"
            icon={<ExternalLink className="size-3.5" />}
            onClick={() => window.open('https://cli.github.com/', '_blank')}
          >
            Install / Setup Guide
          </Button>
        </div>
      )}

      {ghStatus?.installed && !ghStatus.authenticated && (
        <div className="rounded-lg border border-warning/25 bg-warning-muted p-4">
          <p className="text-[13px] text-text">Not authenticated</p>
          <p className="mt-1 text-[12px] text-text-muted">Run "gh auth login" in a terminal to connect your GitHub account.</p>
        </div>
      )}

      {ghStatus?.authenticated && (
        <>
          <div className="flex items-center gap-2 rounded-lg border border-success/25 bg-success-muted px-3 py-2">
            <CheckCircle2 className="size-3.5 text-success" />
            <span className="text-[12.5px] text-text">
              Authenticated as <span className="font-medium">{ghStatus.login}</span>
            </span>
          </div>

          <div>
            <p className="mb-2 text-[11px] font-semibold tracking-wide text-text-faint">PULL REQUEST</p>
            {currentPr ? (
              <div className="rounded-lg border border-border bg-bg-elevated p-4">
                <div className="flex items-center gap-2">
                  <GitPullRequest className="size-4 text-accent" />
                  <span className="text-[13px] font-medium text-text">
                    #{currentPr.number} {currentPr.title}
                  </span>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <Badge tone={currentPr.state === 'OPEN' ? 'success' : 'neutral'}>{currentPr.state}</Badge>
                  {currentPr.isDraft && <Badge tone="warning">Draft</Badge>}
                  <span className="text-mono text-[11.5px] text-text-faint">
                    {currentPr.headRefName} → {currentPr.baseRefName}
                  </span>
                </div>
                <Button
                  variant="secondary"
                  size="sm"
                  className="mt-3"
                  icon={<ExternalLink className="size-3.5" />}
                  onClick={() => window.open(currentPr.url, '_blank')}
                >
                  Open on GitHub
                </Button>
              </div>
            ) : (
              <div className="rounded-lg border border-dashed border-border p-4 text-center">
                <p className="text-[12.5px] text-text-muted">No pull request for this branch yet.</p>
                <Button variant="primary" size="sm" className="mt-3" icon={<GitPullRequest className="size-3.5" />} onClick={() => setPrOpen(true)}>
                  Create Pull Request
                </Button>
              </div>
            )}
          </div>
        </>
      )}

      <CreatePrDialog open={prOpen} onClose={() => setPrOpen(false)} />
    </div>
  )
}
