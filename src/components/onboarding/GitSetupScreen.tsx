import { AlertTriangle, ExternalLink, RefreshCw } from 'lucide-react'
import { useRepoStore } from '@/store/useRepoStore'
import { Button } from '@/components/common/Button'

export function GitSetupScreen() {
  async function recheck() {
    const gitTool = await window.gitControl.checkGit()
    useRepoStore.setState({ gitTool })
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-2xl border border-warning/30 bg-warning-muted">
        <AlertTriangle className="size-5 text-warning" />
      </div>
      <h1 className="text-[18px] font-semibold text-text">Git isn't installed</h1>
      <p className="max-w-sm text-[13px] leading-relaxed text-text-muted">
        Git Control needs the Git command-line tool to manage repositories. Install Git for Windows, then
        check again.
      </p>
      <div className="flex items-center gap-2">
        <Button
          variant="primary"
          icon={<ExternalLink className="size-3.5" />}
          onClick={() => window.open('https://git-scm.com/download/win', '_blank')}
        >
          Download Git
        </Button>
        <Button variant="secondary" icon={<RefreshCw className="size-3.5" />} onClick={recheck}>
          Check Again
        </Button>
      </div>
    </div>
  )
}
