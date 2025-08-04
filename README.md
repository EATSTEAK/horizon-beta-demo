# Monorepo: 2d-game + apple-game (pnpm workspaces)

This repository is a pnpm-based monorepo containing two apps:
- 2d-game
- apple-game

## Prerequisites
- Node.js 18+
- pnpm (as specified in package.json `"packageManager"`)

## Install
```sh
pnpm install
```

## Develop
```sh
# 2d-game
pnpm dev:2d

# apple-game
pnpm dev:apple
```

## Build
```sh
# build all workspaces
pnpm build

# build a specific workspace
pnpm --filter 2d-game build
pnpm --filter apple-game build
```

## Preview
```sh
pnpm preview:2d
pnpm preview:apple
```

## Workspace layout
- 2d-game: existing Vite + TS Pixi.js project
- apple-game: minimal Vite + TS scaffold

## Notes
- Workspaces are defined in pnpm-workspace.yaml and root package.json `workspaces` field.
- If GitHub Actions deploy is used, make sure the workflow selects the target package and sets the correct output directory.