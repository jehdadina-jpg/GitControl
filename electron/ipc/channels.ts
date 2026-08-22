// The single source of truth for allowlisted IPC channel names.
// preload.ts only ever calls ipcRenderer.invoke with one of these strings.
export const CHANNELS = {
  CHECK_GIT: 'app:check-git',
  CHECK_GH: 'app:check-gh',
  COMMAND_LOG: 'app:command-log',

  SELECT_FOLDER: 'fs:select-folder',
  SELECT_CLONE_DESTINATION: 'fs:select-clone-destination',
  IS_GIT_REPOSITORY: 'fs:is-git-repository',
  OPEN_IN_TERMINAL: 'shell:open-terminal',
  OPEN_IN_VSCODE: 'shell:open-vscode',

  GET_REPOS: 'repos:get',
  ADD_REPO: 'repos:add',
  REMOVE_REPO: 'repos:remove',
  TOGGLE_PIN_REPO: 'repos:toggle-pin',

  GET_SETTINGS: 'settings:get',
  UPDATE_SETTINGS: 'settings:update',

  STATUS: 'git:status',
  FETCH: 'git:fetch',
  PULL: 'git:pull',
  PUSH: 'git:push',

  STAGE_FILES: 'git:stage',
  UNSTAGE_FILES: 'git:unstage',
  DISCARD_FILES: 'git:discard',
  COMMIT: 'git:commit',

  DIFF: 'git:diff',
  DIFF_UNTRACKED: 'git:diff-untracked',

  LIST_BRANCHES: 'git:branch-list',
  CREATE_BRANCH: 'git:branch-create',
  CHECKOUT_BRANCH: 'git:branch-checkout',
  DELETE_BRANCH: 'git:branch-delete',
  RENAME_BRANCH: 'git:branch-rename',
  PUSH_BRANCH: 'git:branch-push',

  MERGE_BRANCH: 'git:merge',
  REBASE_BRANCH: 'git:rebase',
  ABORT_MERGE: 'git:merge-abort',
  ABORT_REBASE: 'git:rebase-abort',

  STASH_LIST: 'git:stash-list',
  STASH_CREATE: 'git:stash-create',
  STASH_APPLY: 'git:stash-apply',
  STASH_POP: 'git:stash-pop',
  STASH_DROP: 'git:stash-drop',

  LOG_HISTORY: 'git:log',
  COMMIT_DIFF: 'git:commit-diff',

  LIST_REMOTES: 'git:remotes',
  CLONE_REPOSITORY: 'git:clone',

  CREATE_PULL_REQUEST: 'gh:pr-create',
  GET_PULL_REQUEST_FOR_BRANCH: 'gh:pr-for-branch',
} as const
