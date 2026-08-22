import type { ReactNode } from 'react'
import { useRepoStore } from '@/store/useRepoStore'
import type { AppSettings } from '@/types/git'

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-3 last:border-0">
      <span className="text-[13px] text-text">{label}</span>
      {children}
    </div>
  )
}

const inputClass =
  'rounded-lg border border-border bg-bg-elevated px-2.5 py-1.5 text-[12.5px] text-text focus:border-accent/60 focus:outline-none'

export function SettingsPanel() {
  const settings = useRepoStore((s) => s.settings)
  const updateSettings = useRepoStore((s) => s.updateSettings)

  if (!settings) return null

  function set<K extends keyof AppSettings>(key: K, value: AppSettings[K]) {
    updateSettings({ [key]: value })
  }

  return (
    <div className="max-w-xl overflow-y-auto rounded-xl border border-border bg-panel p-5">
      <h2 className="mb-1 text-[13px] font-semibold text-text">Settings</h2>
      <p className="mb-2 text-[12px] text-text-muted">Configure how Git Control talks to your tools.</p>

      <Field label="Git executable">
        <input
          className={inputClass}
          value={settings.gitExecutable}
          onChange={(e) => set('gitExecutable', e.target.value)}
        />
      </Field>
      <Field label="GitHub CLI executable">
        <input className={inputClass} value={settings.ghExecutable} onChange={(e) => set('ghExecutable', e.target.value)} />
      </Field>
      <Field label="Default branch">
        <input className={inputClass} value={settings.defaultBranch} onChange={(e) => set('defaultBranch', e.target.value)} />
      </Field>
      <Field label="Terminal preference">
        <select
          className={inputClass}
          value={settings.terminalPreference}
          onChange={(e) => set('terminalPreference', e.target.value as AppSettings['terminalPreference'])}
        >
          <option value="powershell">PowerShell</option>
          <option value="cmd">Command Prompt</option>
          <option value="wsl">WSL</option>
        </select>
      </Field>
      <Field label="Open repositories on startup">
        <input
          type="checkbox"
          checked={settings.openReposOnStartup}
          onChange={(e) => set('openReposOnStartup', e.target.checked)}
          className="accent-[var(--color-accent)]"
        />
      </Field>
      <Field label="Confirm destructive actions">
        <input
          type="checkbox"
          checked={settings.confirmDestructiveActions}
          onChange={(e) => set('confirmDestructiveActions', e.target.checked)}
          className="accent-[var(--color-accent)]"
        />
      </Field>
      <Field label="Theme">
        <select className={inputClass} value={settings.theme} onChange={(e) => set('theme', e.target.value as AppSettings['theme'])}>
          <option value="dark">Dark</option>
          <option value="system">System</option>
        </select>
      </Field>
    </div>
  )
}
