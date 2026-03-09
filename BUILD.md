# Build Guide

## Prerequisites

- Node.js 18+
- npm 9+
- macOS for local mac builds
- Windows for native Windows verification when needed

## Install

```bash
npm install
```

## Development

Frontend only:

```bash
npm run dev
```

Electron app with Vite dev server:

```bash
npm run dev:app
```

This compiles the Electron entrypoints first, then starts Vite and Electron together.

## Build commands

Compile Electron entrypoints only:

```bash
npm run build:electron
```

Build frontend + Electron entrypoints:

```bash
npm run build:frontend
```

Build macOS DMG:

```bash
npm run build:mac
```

Build Windows x64 installer:

```bash
npm run build:win:x64
```

Build Windows ARM64 installer:

```bash
npm run build:win:arm64
```

Build all supported release targets:

```bash
npm run build:all
```

## Release artifacts

Configured artifact names:

- macOS: `release/yt-dlp-GUI-<version>-universal.dmg`
- Windows x64: `release/yt-dlp-GUI-Setup-<version>-x64.exe`
- Windows ARM64: `release/yt-dlp-GUI-Setup-<version>-arm64.exe`

## Binary management

The app manages `yt-dlp`, `ffmpeg`, and `ffprobe` separately from the frontend bundle.

- In development, binaries are stored under the repo-local `Application/` directory.
- In packaged builds, binaries are stored under the app's `Application/` resources directory.
- Legacy binaries under `userData/bin` are migrated on startup when possible.
- Initial download and later updates are performed from the app settings UI.

On macOS, `yt-dlp` is downloaded as `yt-dlp_macos`. The app also prefers a bundled JS runtime for YouTube extraction so packaged builds do not rely on an external `node` installation.

## Release automation

GitHub release automation is handled by `.github/workflows/release.yml`.

- Tag pushes matching `v*` trigger matrix builds.
- The workflow runs `npm ci`, `npm run build:frontend`, then publishes Electron Builder artifacts with `GH_TOKEN`.

## Tech stack

- Electron 33.x
- React 18.3.x
- TypeScript 5.x
- Vite 5.x
- Tailwind CSS 3.x
- electron-builder 25.x

## Troubleshooting

Clear build outputs:

```bash
rm -rf dist dist-electron release
```

Reinstall dependencies:

```bash
rm -rf node_modules
npm install
```

If packaged downloads fail after an old install, remove stale binaries from the app-managed `Application/` directory and download them again from settings.
