# yt-dlp GUI

モダンで使いやすい `yt-dlp` のクロスプラットフォーム GUI フロントエンドです。
コマンドライン操作が苦手な方でも、高機能な動画ダウンローダーである `yt-dlp` の機能を簡単に利用できます。

![App Screenshot](https://via.placeholder.com/800x500?text=yt-dlp+GUI+Screenshot)
*(スクリーンショットをここに貼ってください)*

## ✨ 主な機能

*   **モダンなユーザーインターフェース**: 直感的で美しいデザイン（Electron + React + Tailwind CSS）。
*   **テーマ切り替え**: Midnight, Cyberpunk, Ocean, Forest など、気分に合わせてテーマを変更可能。
*   **動画・音声ダウンロード**:
    *   動画形式: MP4, WebM, MKV など
    *   音声形式: MP3, M4A, WAV, FLAC など
    *   解像度選択: 4K, 1080p, 720p, 最高画質など
*   **高度なオプション**:
    *   サムネイルの埋め込み
    *   メタデータ（タイトル、アーティスト等）の追加
    *   字幕のダウンロードと埋め込み
    *   チャプター分割
    *   Cookieを使用したブラウザ連携（プレミアム会員限定動画など）
*   **バイナリ自動管理**: `yt-dlp` と `ffmpeg` をアプリ内から自動でダウンロード・更新できます。バージョン情報の確認も可能です。
*   **便利な機能**:
    *   クリップボード監視（URLをコピーするだけで自動入力）
    *   ダウンロード履歴の保存と管理
    *   よく使う設定を保存できる「プリセット」機能
    *   お気に入り保存先フォルダの登録
    *   アプリ自体の更新確認機能
    *   ダウンロードのキャンセル機能

## 📦 インストール

[Releases](https://github.com/tomakura/yt-dlp-gui/releases) ページから、お使いの OS に合わせたインストーラーをダウンロードしてください。

*   **macOS**: `.dmg` (Universal - Intel / Apple Silicon 両対応)
*   **Windows**: `.exe` (インストーラー版 または ポータブル版)

## 🛠 開発者向け情報

このプロジェクトは以下の技術スタックで構築されています。

*   [Electron](https://www.electronjs.org/)
*   [React](https://react.dev/)
*   [TypeScript](https://www.typescriptlang.org/)
*   [Vite](https://vitejs.dev/)
*   [Tailwind CSS](https://tailwindcss.com/)
*   [Framer Motion](https://www.framer.com/motion/) (アニメーション)

### セットアップ

1.  リポジトリをクローンします。
    ```bash
    git clone https://github.com/tomakura/yt-dlp-gui.git
    cd yt-dlp-gui
    ```

2.  依存関係をインストールします。
    ```bash
    npm install
    ```

3.  開発サーバーを起動します。
    ```bash
    npm run dev
    ```

### ビルド

本番用のアプリケーション（インストーラー）を作成するには以下のコマンドを実行します。

```bash
# macOS と Windows 両方のビルド (macOS上で実行する場合)
npm run electron:build -- --mac --win

# 個別のビルド
npm run electron:build -- --mac
npm run electron:build -- --win
```

## 📝 ライセンス

[MIT License](LICENSE)

## 🙏 クレジット

このアプリケーションは以下の素晴らしいオープンソースプロジェクトを利用しています。

*   [yt-dlp](https://github.com/yt-dlp/yt-dlp): 動画ダウンロードのコア機能
*   [FFmpeg](https://ffmpeg.org/): 動画・音声の変換処理

