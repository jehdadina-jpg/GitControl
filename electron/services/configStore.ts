import { app } from 'electron'
import { promises as fs } from 'node:fs'
import path from 'node:path'
import { randomUUID } from 'node:crypto'
import type { AppSettings, RepoEntry } from '../../src/types/git'

interface PersistedState {
  settings: AppSettings
  repos: RepoEntry[]
}

const DEFAULT_SETTINGS: AppSettings = {
  gitExecutable: 'git',
  ghExecutable: 'gh',
  defaultBranch: 'main',
  terminalPreference: 'powershell',
  openReposOnStartup: true,
  confirmDestructiveActions: true,
  theme: 'dark',
}

const DEFAULT_STATE: PersistedState = {
  settings: DEFAULT_SETTINGS,
  repos: [],
}

let cache: PersistedState | null = null

function filePath(): string {
  return path.join(app.getPath('userData'), 'git-control-state.json')
}

async function load(): Promise<PersistedState> {
  if (cache) return cache
  try {
    const raw = await fs.readFile(filePath(), 'utf-8')
    const parsed = JSON.parse(raw) as Partial<PersistedState>
    cache = {
      settings: { ...DEFAULT_SETTINGS, ...parsed.settings },
      repos: parsed.repos ?? [],
    }
  } catch {
    cache = { ...DEFAULT_STATE }
  }
  return cache
}

async function persist(): Promise<void> {
  if (!cache) return
  await fs.mkdir(path.dirname(filePath()), { recursive: true })
  await fs.writeFile(filePath(), JSON.stringify(cache, null, 2), 'utf-8')
}

export async function getSettings(): Promise<AppSettings> {
  const state = await load()
  return state.settings
}

export async function updateSettings(partial: Partial<AppSettings>): Promise<AppSettings> {
  const state = await load()
  state.settings = { ...state.settings, ...partial }
  await persist()
  return state.settings
}

export async function getRepos(): Promise<RepoEntry[]> {
  const state = await load()
  return [...state.repos].sort((a, b) => {
    if (a.pinned !== b.pinned) return a.pinned ? -1 : 1
    return new Date(b.lastOpened).getTime() - new Date(a.lastOpened).getTime()
  })
}

export async function upsertRepo(repoPath: string, name: string): Promise<RepoEntry[]> {
  const state = await load()
  const existing = state.repos.find((r) => r.path === repoPath)
  const now = new Date().toISOString()
  if (existing) {
    existing.lastOpened = now
    existing.name = name
  } else {
    state.repos.push({ id: randomUUID(), path: repoPath, name, pinned: false, lastOpened: now })
  }
  await persist()
  return getRepos()
}

export async function removeRepo(id: string): Promise<RepoEntry[]> {
  const state = await load()
  state.repos = state.repos.filter((r) => r.id !== id)
  await persist()
  return getRepos()
}

export async function togglePinRepo(id: string): Promise<RepoEntry[]> {
  const state = await load()
  const repo = state.repos.find((r) => r.id === id)
  if (repo) repo.pinned = !repo.pinned
  await persist()
  return getRepos()
}
