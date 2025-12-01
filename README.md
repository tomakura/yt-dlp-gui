# yt-dlp GUI

[日本語](#日本語) | [English](#english)

[![Ko-fi](https://img.shields.io/badge/Ko--fi-Support%20Me-ff5e5b?logo=ko-fi&logoColor=white)](https://ko-fi.com/tomakura)

---

## 日本語

モダンで使いやすい `yt-dlp` のクロスプラットフォーム GUI フロントエンドです。

## ✨ 主な機能

*   **モダンなユーザーインターフェース**: 直感的で美しいデザイン
*   **多言語対応**: 日本語・英語
*   **動画情報プレビュー**: URLを入力するとサムネイル・タイトル・チャンネル名・最高画質を表示
*   **プレイリスト対応**: ギャラリー風ナビゲーションで複数動画をまとめてダウンロード
*   **動画ダウンロード**: MP4, WebM, MKV / 解像度: 4K〜360p
*   **音声ダウンロード**: MP3, M4A, AAC, WAV, FLAC
*   **高度なオプション**: サムネイル埋め込み、メタデータ追加、字幕埋め込み、チャプター分割、ブラウザCookie連携
*   **便利な機能**: クリップボード監視、ダウンロード履歴、プリセット、お気に入りフォルダ

## 📦 インストール

### 1. アプリのダウンロード

[Releases](https://github.com/tomakura/yt-dlp-gui/releases) ページから対応するインストーラーをダウンロード･実行

| OS | ファイル | 対象 |
|----|--------|------|
| macOS | `.dmg` | Intel / Apple Silicon 両対応 |
| Windows x64 | `.exe` | 一般的な64ビット WindowsPC |
| Windows ARM64 | `.exe` | Surface Pro X, Snapdragon搭載PCなど |

<details>
<summary>💡 Windows: インストール時の注意</summary>

インストーラー実行時に「Windows によって PC が保護されました」という警告が表示される場合があります。

1. **「詳細情報」** をクリック
2. **「実行」** ボタンをクリック

これはアプリがコード署名されていないために表示される警告です。ソースコードは公開されており、安全にご利用いただけます。

</details>

<details>
<summary>💡 macOS: 初回起動時の注意</summary>

初回起動時に「開発元を検証できない」という警告が表示される場合があります。

1. **システム設定** > **プライバシーとセキュリティ** を開く
2. 「"yt-dlp GUI"は開発元を確認できないため...」の横にある **「このまま開く」** をクリック

</details>

### 2. バイナリのダウンロード（初回のみ）

アプリを起動したら、以下の手順で必要なバイナリをダウンロードしてください：

1. 右上の **⚙️** (設定)ボタンをクリック
2. **バイナリ** タブを選択
3. `yt-dlp` と `ffmpeg` の **ダウンロード** ボタンをクリック

> ⚠️ バイナリをダウンロードしないと動画のダウンロードができません

### 3. バイナリの更新

yt-dlp・ffmpegは、以下の手順で更新できます。

1. 右上の **⚙️** (設定)ボタンをクリック
2. **バイナリ** タブを選択
3. それぞれの **更新** ボタンをクリック

## 🚀 使い方

1. 動画のURLを入力欄に貼り付け
2. 形式（動画/音声）と品質を選択
3. **ダウンロード** ボタンをクリック

## 📝 ライセンス

[MIT License](LICENSE)

## 🙏 クレジット

*   [yt-dlp](https://github.com/yt-dlp/yt-dlp)
*   [FFmpeg](https://ffmpeg.org/)

## ☕ サポート

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/tomakura)

---

## English

A modern and user-friendly cross-platform GUI frontend for `yt-dlp`.

## ✨ Features

*   **Modern UI**: Intuitive and beautiful design
*   **Multi-language**: Japanese and English
*   **Video Info Preview**: Shows thumbnail, title, channel, and best quality when URL is entered
*   **Playlist Support**: Gallery navigation for downloading multiple videos
*   **Video Download**: MP4, WebM, MKV / Resolution: 4K to 360p
*   **Audio Download**: MP3, M4A, AAC, WAV, FLAC
*   **Advanced Options**: Embed thumbnails, metadata, subtitles, chapter splitting, browser cookies
*   **Convenience**: Clipboard monitoring, download history, presets, favorite folders

## 📦 Installation

### 1. Download the App

Download and run the installer for your platform from [Releases](https://github.com/tomakura/yt-dlp-gui/releases)

| OS | File | Target |
|----|------|--------|
| macOS | `.dmg` | Intel / Apple Silicon |
| Windows x64 | `.exe` | Standard 64-bit Windows PCs |
| Windows ARM64 | `.exe` | Surface Pro X, Snapdragon PCs, etc. |

<details>
<summary>💡 Windows: Installation Note</summary>

You may see a "Windows protected your PC" warning when running the installer.

1. Click **"More info"**
2. Click **"Run anyway"**

This warning appears because the app is not code-signed. The source code is open and safe to use.

</details>

<details>
<summary>💡 macOS: First Launch Note</summary>

You may see an "unidentified developer" warning on first launch.

1. Open **System Settings** > **Privacy & Security**
2. Click **"Open Anyway"** next to the message about "yt-dlp GUI"

</details>

### 2. Download Binaries (First Time Only)

After launching the app, download the required binaries:

1. Click the **⚙️** (Settings) button in the top right
2. Select the **Binary** tab
3. Click the **Download** button for `yt-dlp` and `ffmpeg`

> ⚠️ Video downloads will not work without downloading the binaries

### 3. Update Binaries

You can update yt-dlp and ffmpeg as follows:

1. Click the **⚙️** (Settings) button in the top right
2. Select the **Binary** tab
3. Click the **Update** button for each

## 🚀 Usage

1. Paste a video URL into the input field
2. Select format (video/audio) and quality
3. Click the **Download** button

## 📝 License

[MIT License](LICENSE)

## 🙏 Credits

*   [yt-dlp](https://github.com/yt-dlp/yt-dlp)
*   [FFmpeg](https://ffmpeg.org/)

## ☕ Support

[![Ko-fi](https://ko-fi.com/img/githubbutton_sm.svg)](https://ko-fi.com/tomakura)
