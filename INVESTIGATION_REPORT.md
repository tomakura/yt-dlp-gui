# yt-dlp GUI Investigation Report

Date: 2026-03-09

## Baseline

- `npm run lint`: fails before linting any source files.
- `npm run build:frontend`: passes.
- `npm run dev:app`: starts Vite and Electron without an immediate preload crash in the observed startup window.

## Immediate Issues

### P1. ESLint is permanently broken

- Reproduction: run `npm run lint`.
- Evidence:
  - [`eslint.config.js:15`](/Users/flow/Programs/yt-dlp-gui/eslint.config.js#L15) references `reactHooks.configs.flat.recommended`.
  - Installed `eslint-plugin-react-hooks` is `5.2.0`, and its exported configs are `recommended-legacy`, `recommended`, and `recommended-latest`.
- Impact: the repo has no working lint gate, so config and type drift can accumulate without CI or local feedback.
- Root cause: the config expects a `flat` namespace that is not present in the installed plugin version.
- Fix direction: either switch to the plugin's actual exported config shape or pin a plugin version whose API matches the config. The safer path is to update [`eslint.config.js`](/Users/flow/Programs/yt-dlp-gui/eslint.config.js) to use the installed plugin's supported export surface.

### P1. Binary download cancel path is reported as success

- Reproduction:
  1. Start a binary download from the settings UI.
  2. Cancel it.
  3. The main process returns `'cancelled'`, but the renderer checks only truthiness and enters the success branch.
- Evidence:
  - [`electron/main.ts:796`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L796) to [`electron/main.ts:797`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L797) returns `'cancelled'` from `download-binaries`.
  - [`src/types/electron.d.ts:102`](/Users/flow/Programs/yt-dlp-gui/src/types/electron.d.ts#L102) still types `downloadBinaries` as `Promise<boolean>`.
  - [`src/App.tsx:960`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L960) to [`src/App.tsx:967`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L967) uses `if (success)`.
- Impact: cancelled downloads are shown as completed, logs claim success, and binary presence is rechecked as if installation finished normally.
- Root cause: main, preload/types, and renderer do not share a single return contract for the download flow.
- Fix direction: lock the API to `true | false | 'cancelled'` and update the renderer branch logic accordingly.

### P1. Binary progress details are silently dropped

- Reproduction:
  1. Start `yt-dlp`, `ffmpeg`, or combined binary download/update.
  2. Open the settings progress UI.
  3. Percentage text appears, but MB downloaded / total / speed detail path never receives the payload shape it expects.
- Evidence:
  - [`src/types/electron.d.ts:23`](/Users/flow/Programs/yt-dlp-gui/src/types/electron.d.ts#L23) to [`src/types/electron.d.ts:33`](/Users/flow/Programs/yt-dlp-gui/src/types/electron.d.ts#L33) defines `progressData`.
  - [`src/components/SettingsModal.tsx:108`](/Users/flow/Programs/yt-dlp-gui/src/components/SettingsModal.tsx#L108) to [`src/components/SettingsModal.tsx:120`](/Users/flow/Programs/yt-dlp-gui/src/components/SettingsModal.tsx#L120) only formats detailed progress when `progressData` exists.
  - [`electron/main.ts:663`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L663) to [`electron/main.ts:665`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L665), [`electron/main.ts:697`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L697) to [`electron/main.ts:699`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L699), and [`electron/main.ts:748`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L748) to [`electron/main.ts:750`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L750) send top-level `downloaded` only.
- Impact: the UI cannot show the detailed progress state it was designed for, and the typed contract is misleading.
- Root cause: the wire payload shape diverged from the declared `BinaryUpdateProgress` interface.
- Fix direction: choose one canonical payload shape. The lowest-risk choice is to keep `progressData` in the public type and send `{ downloaded, total, speed }` from the main process.

### P1. `fetchVideoInfo()` types are stale and hidden by casts

- Reproduction:
  1. Enter a URL and trigger preview fetch.
  2. The renderer accepts data through `as PlaylistInfo` / `as VideoInfo`, so build passes even when the declared IPC contract is incomplete.
- Evidence:
  - [`electron/main.ts:1126`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L1126) to [`electron/main.ts:1228`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L1228) returns `bestResolution`, format `height`, format `abr`, and playlist-entry `bestResolution`.
  - [`src/types/electron.d.ts:35`](/Users/flow/Programs/yt-dlp-gui/src/types/electron.d.ts#L35) to [`src/types/electron.d.ts:76`](/Users/flow/Programs/yt-dlp-gui/src/types/electron.d.ts#L76) does not declare those fields.
  - [`src/components/VideoPreview.tsx:6`](/Users/flow/Programs/yt-dlp-gui/src/components/VideoPreview.tsx#L6) to [`src/components/VideoPreview.tsx:35`](/Users/flow/Programs/yt-dlp-gui/src/components/VideoPreview.tsx#L35) defines UI models that do expect them.
  - [`src/App.tsx:459`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L459) to [`src/App.tsx:462`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L462) suppresses the mismatch with casts.
- Impact: the public IPC contract is unreliable, future refactors can break preview rendering without type errors, and the current build gives a false sense of safety.
- Root cause: the source-of-truth IPC type file was not updated when the main-process response expanded.
- Fix direction: update `VideoInfoResult` to match the actual payload and remove the casts from the renderer path where possible.

### P2. `window.electron` guards are partial and leave startup paths exposed

- Reproduction:
  1. Run the renderer with a missing or stale preload, or any environment where `window.electron` is unavailable.
  2. Some effects guard the API, but startup calls such as binary checks and app update checks do not.
- Evidence:
  - Guarded access exists for listeners and default download path at [`src/App.tsx:603`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L603) to [`src/App.tsx:610`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L610) and [`src/App.tsx:618`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L618) onward.
  - Unguarded access remains at [`src/App.tsx:449`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L449), [`src/App.tsx:494`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L494), [`src/App.tsx:518`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L518), and [`src/App.tsx:555`](/Users/flow/Programs/yt-dlp-gui/src/App.tsx#L555).
- Impact: startup and preview fetch remain vulnerable to runtime errors that build and lint do not cover.
- Root cause: API hardening was added incrementally, not systematically, after the preload surface changed.
- Fix direction: centralize an availability guard or typed accessor for `window.electron` and route all startup calls through it.

### P2. `DownloadPayload` is no longer a trustworthy contract

- Reproduction: inspect the payload sent by the renderer and the payload interface consumed by the main process.
- Evidence:
  - [`src/types/electron.d.ts:3`](/Users/flow/Programs/yt-dlp-gui/src/types/electron.d.ts#L3) to [`src/types/electron.d.ts:13`](/Users/flow/Programs/yt-dlp-gui/src/types/electron.d.ts#L13) includes `notificationsEnabled`.
  - [`electron/main.ts:35`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L35) to [`electron/main.ts:66`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L66) does not.
- Impact: the UI can send a field that the main process ignores, which makes the contract misleading and invites dead settings.
- Root cause: renderer payload evolution outpaced the main-process interface.
- Fix direction: either implement notification behavior end to end or remove the field from the public IPC payload until it is actually consumed.

## Operational Breakages

### P1. Release workflow is still a Tauri pipeline

- Reproduction: inspect the release workflow.
- Evidence:
  - [`release.yml:10`](/Users/flow/Programs/yt-dlp-gui/.github/workflows/release.yml#L10) names the job `publish-tauri`.
  - [`release.yml:33`](/Users/flow/Programs/yt-dlp-gui/.github/workflows/release.yml#L33) to [`release.yml:36`](/Users/flow/Programs/yt-dlp-gui/.github/workflows/release.yml#L36) installs Rust targets.
  - [`release.yml:41`](/Users/flow/Programs/yt-dlp-gui/.github/workflows/release.yml#L41) to [`release.yml:51`](/Users/flow/Programs/yt-dlp-gui/.github/workflows/release.yml#L41) invokes `tauri-apps/tauri-action@v0.5`.
- Impact: tagged releases are not aligned with the current Electron packaging flow in [`package.json:14`](/Users/flow/Programs/yt-dlp-gui/package.json#L14) to [`package.json:20`](/Users/flow/Programs/yt-dlp-gui/package.json#L20). Release automation is effectively broken for the current stack.
- Root cause: the app architecture moved from Tauri to Electron, but CI/release automation did not.
- Fix direction: replace the workflow with an Electron Builder release pipeline and remove obsolete Rust setup.

### P2. `BUILD.md` is stale in multiple concrete ways

- Reproduction: compare documentation to package scripts and runtime paths.
- Evidence:
  - [`BUILD.md:92`](/Users/flow/Programs/yt-dlp-gui/BUILD.md#L92) says binaries download automatically on first launch, while [`README.md:161`](/Users/flow/Programs/yt-dlp-gui/README.md#L161) to [`README.md:169`](/Users/flow/Programs/yt-dlp-gui/README.md#L169) instruct users to download them manually and the renderer does not auto-download missing binaries.
  - [`BUILD.md:94`](/Users/flow/Programs/yt-dlp-gui/BUILD.md#L94) to [`BUILD.md:95`](/Users/flow/Programs/yt-dlp-gui/BUILD.md#L95) documents `~/Library/Application Support/yt-dlp-gui/bin/` and `%APPDATA%/yt-dlp-gui/bin/`, but the current runtime path is [`electron/main.ts:69`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L69) to [`electron/main.ts:71`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L71) with legacy migration from [`electron/main.ts:509`](/Users/flow/Programs/yt-dlp-gui/electron/main.ts#L509) only.
  - [`BUILD.md:48`](/Users/flow/Programs/yt-dlp-gui/BUILD.md#L48) and [`BUILD.md:58`](/Users/flow/Programs/yt-dlp-gui/BUILD.md#L58) describe artifact names that do not match [`package.json:75`](/Users/flow/Programs/yt-dlp-gui/package.json#L75) and [`package.json:79`](/Users/flow/Programs/yt-dlp-gui/package.json#L79).
  - [`BUILD.md:128`](/Users/flow/Programs/yt-dlp-gui/BUILD.md#L128) claims React 19.x, while [`package.json:28`](/Users/flow/Programs/yt-dlp-gui/package.json#L28) shows React 18.3.1.
- Impact: contributor onboarding, packaging expectations, and runtime support guidance are inconsistent with the code that actually ships.
- Root cause: the build guide was not maintained after packaging and runtime changes.
- Fix direction: rewrite `BUILD.md` from current scripts and artifact definitions instead of patching isolated lines.

## Suggested Implementation Order

1. Restore the lint gate so the repo regains a reliable static feedback path.
2. Lock the Electron IPC contracts for binary download/update flows and preview fetch.
3. Remove renderer casts and branch on explicit result types for cancel/failure/success flows.
4. Align the release workflow with Electron Builder.
5. Rewrite `BUILD.md` from the current package scripts and runtime behavior.

## Notes On Current Working Tree

- The repository already contains uncommitted changes in `electron/main.ts`, `electron/preload.ts`, `package.json`, `src/App.tsx`, `src/types/options.js`, `vite.config.ts`, and `tsconfig.preload.json`.
- Some issues above may have been introduced or surfaced by that in-progress work. Any fix implementation should separate pre-existing defects from newly introduced contract drift before editing behavior.
