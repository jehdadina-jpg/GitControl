import { spawn } from 'node:child_process'
import { getSettings } from './configStore'

export async function openInTerminal(repoPath: string): Promise<void> {
  const settings = await getSettings()
  const detached = { cwd: repoPath, detached: true, stdio: 'ignore' as const, windowsHide: false }
  switch (settings.terminalPreference) {
    case 'cmd':
      spawn('cmd.exe', ['/c', 'start', 'cmd.exe'], detached).unref()
      break
    case 'wsl':
      spawn('cmd.exe', ['/c', 'start', 'wsl.exe'], detached).unref()
      break
    case 'powershell':
    default:
      spawn('cmd.exe', ['/c', 'start', 'powershell.exe', '-NoExit', '-Command', `Set-Location -LiteralPath '${repoPath}'`], {
        ...detached,
      }).unref()
      break
  }
}

export async function openInVsCode(repoPath: string): Promise<void> {
  spawn('cmd.exe', ['/c', 'code', '.'], { cwd: repoPath, detached: true, stdio: 'ignore', windowsHide: true }).unref()
}
