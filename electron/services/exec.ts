import { spawn } from 'node:child_process'
import { randomUUID } from 'node:crypto'
import type { CommandLogEntry } from '../../src/types/git'

export interface ExecOptions {
  cwd: string
  timeoutMs?: number
  input?: string
  env?: NodeJS.ProcessEnv
}

export interface ExecResult {
  code: number | null
  stdout: string
  stderr: string
  timedOut: boolean
  log: CommandLogEntry
}

const DEFAULT_TIMEOUT_MS = 30_000

/**
 * Runs a command as an argument array (never a shell string) and captures
 * stdout/stderr/exit code. This is the single choke point through which the
 * app touches child_process — every Git/PowerShell/gh invocation goes through
 * here so behavior (timeouts, logging, cancellation) stays consistent.
 */
export function runCommand(command: string, args: string[], options: ExecOptions): Promise<ExecResult> {
  const startedAt = new Date().toISOString()
  const logBase: CommandLogEntry = {
    id: randomUUID(),
    command,
    args,
    cwd: options.cwd,
    startedAt,
  }

  return new Promise((resolve) => {
    let stdout = ''
    let stderr = ''
    let timedOut = false
    let settled = false

    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
      env: { ...process.env, ...options.env },
    })

    const timeout = setTimeout(() => {
      timedOut = true
      child.kill()
    }, options.timeoutMs ?? DEFAULT_TIMEOUT_MS)

    if (options.input !== undefined) {
      child.stdin.write(options.input)
    }
    child.stdin.end()

    child.stdout.on('data', (chunk: Buffer) => {
      stdout += chunk.toString('utf-8')
    })
    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf-8')
    })

    const finish = (code: number | null) => {
      if (settled) return
      settled = true
      clearTimeout(timeout)
      const finishedAt = new Date().toISOString()
      resolve({
        code,
        stdout,
        stderr,
        timedOut,
        log: {
          ...logBase,
          finishedAt,
          exitCode: code,
          stdout,
          stderr,
          ok: code === 0,
        },
      })
    }

    child.on('error', (err) => {
      stderr += `\n${err.message}`
      finish(null)
    })
    child.on('close', (code) => finish(code))
  })
}
