# ビルドガイド / Build Guide

## 必要な環境 / Prerequisites

- **Node.js**: 18.x 以上
- **npm**: 9.x 以上
- **OS**: macOS（Mac/Windows両方のビルドが可能）

## 依存関係のインストール / Install Dependencies

```bash
npm install
```

## 開発モード / Development Mode

```bash
npm run dev
```

開発サーバーが起動し、ホットリロードが有効になります。

Electron で起動する場合は別ターミナルで以下を実行:

```bash
npm run dev:electron
```

## ビルドコマンド / Build Commands

### Mac版（Universal Binary）

```bash
npm run electron:build -- --mac
```

出力: `release/yt-dlp GUI-<version>-universal.dmg`

- Intel Mac と Apple Silicon Mac の両方で動作
- コード署名なしでビルド

### Windows版（x64）

```bash
npm run electron:build -- --win --x64
```

出力: `release/yt-dlp GUI Setup <version>-x64.exe`

- 一般的な64ビットWindowsマシン向け

### Windows版（ARM64）

```bash
npm run electron:build -- --win --arm64
```

出力: `release/yt-dlp GUI Setup <version>-arm64.exe`

- Surface Pro X、Snapdragon搭載PC向け

### すべてをビルド

```bash
npm run electron:build -- --mac && \
npm run electron:build -- --win --x64 && \
npm run electron:build -- --win --arm64
```

## ビルド成果物 / Build Artifacts

ビルド完了後、`release/` ディレクトリに以下が生成されます：

| ファイル | 対象プラットフォーム | サイズ目安 |
|---------|---------------------|-----------|
| `yt-dlp GUI-1.0.0-universal.dmg` | macOS (Intel/Apple Silicon) | ~200MB |
| `yt-dlp GUI Setup 1.0.0-x64.exe` | Windows x64 | ~100MB |
| `yt-dlp GUI Setup 1.0.0-arm64.exe` | Windows ARM64 | ~105MB |

## バイナリ管理について / Binary Management

このアプリは **yt-dlp** と **ffmpeg** を必要としますが、これらはアプリにバンドルされていません。

- 初回起動時に自動的にダウンロードされます
- 保存場所:
  - **macOS**: `~/Library/Application Support/yt-dlp-gui/bin/`
  - **Windows**: `%APPDATA%/yt-dlp-gui/bin/`
- 設定画面からいつでも再ダウンロード/更新可能

### ダウンロードされるバイナリ

| バイナリ | macOS | Windows |
|---------|-------|---------|
| yt-dlp | [yt-dlp/yt-dlp](https://github.com/yt-dlp/yt-dlp) の `yt-dlp_macos` | `yt-dlp.exe` |
| ffmpeg | [ffbinaries](https://ffbinaries.com/) | [yt-dlp/FFmpeg-Builds](https://github.com/yt-dlp/FFmpeg-Builds) |

## コード署名 / Code Signing

現在、コード署名は設定されていません。

### macOS

未署名のアプリを実行するには:
1. `.dmg` をマウント
2. アプリを右クリック → 「開く」を選択
3. 警告ダイアログで「開く」をクリック

または、ターミナルで:
```bash
xattr -cr "/Applications/yt-dlp GUI.app"
```

### Windows

SmartScreenの警告が表示される場合があります。「詳細情報」→「実行」で起動できます。

## 技術スタック / Tech Stack

- **Electron**: 33.x
- **React**: 19.x
- **TypeScript**: 5.x
- **Vite**: 5.x
- **Tailwind CSS**: 3.x
- **electron-builder**: 25.x

## トラブルシューティング / Troubleshooting

### ビルドエラー: native dependency

```bash
npm rebuild
```

### キャッシュクリア

```bash
rm -rf node_modules dist dist-electron release
npm install
```

### Windows ARM64ビルドが失敗する

macOSからのクロスコンパイルでは稀に問題が発生することがあります。
その場合は Windows ARM64 マシンで直接ビルドしてください。
