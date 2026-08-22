# Git Control

A premium Windows desktop app for visually driving Git and GitHub from one place — no manual shell commands required for everyday workflows.

Electron + React + TypeScript + Vite + Tailwind CSS v4, with all Git/GitHub CLI execution isolated to the Electron main process behind a strict, allowlisted IPC layer (`electron/ipc/channels.ts`).

## Requirements

- [Git](https://git-scm.com/download/win) on `PATH` (the app detects this at startup and shows a setup screen if it's missing).
- [GitHub CLI](https://cli.github.com/) (`gh`) on `PATH` — optional. Local Git features work without it; GitHub features (PR create/view) are hidden behind a "not detected" state until `gh auth login` has been run.
- Node.js 20+.

## Getting started

```bash
npm install
npm run dev
```

`npm run dev` starts Vite and launches the Electron window against the dev server with hot reload for the renderer and auto-restart for the main process.

## Building

```bash
npm run build:app     # type-check + build renderer and electron bundles (no installer)
npm run build          # build + package a Windows installer via electron-builder
npm run electron:pack  # unpacked build only, for quick local testing of the packaged app
```

The installer output lands in `release/`.

## Project layout

```
electron/            Electron main process (never bundled into the renderer)
  main.ts             Window creation, lifecycle
  preload.ts          contextBridge surface — the only thing the renderer can call
  ipc/                Allowlisted channel names + handlers
  services/           Git/GitHub CLI execution, parsing, persistence, shell integration
src/                  React renderer
  components/         Feature-organized UI (layout, repo, changes, diff, branches, graph, history, stash, github, terminal, palette, settings, onboarding, common)
  store/               Zustand stores (repo state + UI state)
  types/               Shared types, including the IPC contract
  lib/                 Formatting, class-name, diff/graph helpers
```

## Safety model

- The renderer never talks to `child_process`, the filesystem, or a shell directly — every action goes through `window.gitControl.*`, which maps 1:1 to a fixed IPC channel handled in the main process.
- All Git/gh invocations use `spawn` with argument arrays — no shell string interpolation.
- Destructive operations (discard, force push, rebase, delete branch) require an explicit confirmation dialog that states what will happen before it happens.
