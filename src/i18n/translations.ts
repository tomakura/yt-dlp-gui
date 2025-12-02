export type Language = 'ja' | 'en';

export const translations = {
  ja: {
    // App
    appTitle: 'yt-dlp GUI',
    download: 'ダウンロード',
    downloading: 'ダウンロード中...',
    cancel: 'キャンセル',
    settings: '設定',
    history: '履歴',

    // URL Input
    downloadUrl: 'ダウンロードURL',
    urlPlaceholder: 'https://www.youtube.com/watch?v=...',
    paste: '貼り付け',
    clipboardMonitoring: 'クリップボード監視',
    importFile: 'ファイルからインポート',
    importFileTooltip: 'テキストファイル(.txt)からURLを一括読み込み',

    // Format Selector
    video: '動画',
    audio: '音声',
    format: 'フォーマット',
    resolution: '解像度',
    container: 'コンテナ',
    bitrate: 'ビットレート',
    sampleRate: 'サンプルレート',
    bitDepth: 'ビット深度',
    best: '最高',
    auto: '自動',

    // Video Conversion
    conversionOptions: '変換オプション',
    enableConversion: '変換を有効化',
    videoCodec: '動画コーデック',
    audioCodec: '音声コーデック',
    videoBitrate: '動画ビットレート',
    audioBitrateConv: '音声ビットレート',
    copy: 'コピー (無変換)',

    // Location Selector
    saveTo: '保存先',
    selectFolder: 'フォルダを選択',
    browse: '参照',
    folderPathPlaceholder: 'フォルダパスを入力',
    favorites: 'お気に入り',
    addToFavorites: 'お気に入りに追加',
    removeFromFavorites: 'お気に入りから削除',
    noFavorites: 'お気に入りフォルダがありません',

    // Advanced Options
    advancedOptions: '詳細オプション',
    embedThumbnail: 'サムネイルを埋め込み',
    embedMetadata: 'メタデータを埋め込み',
    embedSubtitles: '字幕を埋め込み',
    writeAutoSub: '自動字幕を書き出し',
    splitChapters: 'チャプターで分割',
    playlist: 'プレイリスト',
    playlistDefault: '自動',
    playlistSingle: '単体のみ',
    playlistAll: 'プレイリスト全て',
    browserCookies: 'ブラウザCookie',
    noCookies: '使用しない',
    audioModeWarning: '⚠️ 音声モードでは、字幕埋め込み・自動字幕・チャプター分割は利用できません。',
    notAvailableInAudioMode: '音声モードでは利用できません',
    customArgs: 'カスタム引数',
    customArgsPlaceholder: '例: --no-playlist',
    timeRange: '時間指定切り抜き',
    startTime: '開始時間',
    endTime: '終了時間',

    // Status
    idle: '待機中',
    downloadComplete: 'ダウンロードが完了しました',
    downloadError: 'エラーが発生しました',
    downloadCancelled: 'キャンセルしました',

    // Settings Modal
    settingsTitle: '設定',
    general: '一般',
    appearance: '外観',
    binaries: 'バイナリ',
    presets: 'プリセット',
    info: '情報',

    // General Settings
    generalSettings: '一般設定',
    generalSettingsDesc: '基本的なアプリケーションの動作設定',
    outputTemplate: '保存ファイル名テンプレート',
    outputTemplateHelp: 'yt-dlpの出力テンプレート形式で指定してください。',
    templateDefault: 'デフォルト',
    templateWithDate: '日付付き',
    templateWithUploader: '投稿者付き',
    enableNotifications: 'システム通知を有効化',
    enableNotificationsDesc: 'ダウンロード完了時やエラー時にOSの通知を表示します',

    // Appearance Settings
    theme: 'テーマ',
    appearanceSettings: '外観設定',
    appearanceSettingsDesc: 'テーマとビジュアルのカスタマイズ',

    // Binary Settings
    binaryManagement: 'バイナリ管理',
    binaryDescription: 'yt-dlp および ffmpeg の管理',
    status: 'ステータス',
    installed: 'インストール済み',
    notDetected: '未検出',
    checking: '確認中...',
    version: 'バージョン',
    latest: '最新',
    updateAvailable: '更新あり',
    unknown: '不明',
    updateYtDlp: 'yt-dlpを更新',
    updateFfmpeg: 'ffmpegを更新',
    downloadBinaries: 'バイナリを自動ダウンロード',
    cancelDownload: 'キャンセル',

    // Preset Settings
    presetManagement: 'プリセット管理',
    presetDescription: 'よく使う設定を保存・読み込み',
    presetNamePlaceholder: 'プリセット名 (例: 高画質保存)',
    save: '保存',
    noPresets: 'プリセットがありません',

    // Info Tab
    appInfo: 'アプリケーション情報',
    appVersion: 'アプリバージョン',
    author: '制作者',
    checkForUpdates: 'アプリケーションの更新を確認',
    checkingUpdates: '確認中...',
    newVersionAvailable: '新しいバージョン v{version} が利用可能です',
    upToDate: '最新バージョンを使用中です',
    openDownloadPage: 'ダウンロードページを開く',
    updateCheckFailed: '更新の確認に失敗しました',

    // Ko-fi
    supportDevelopment: '開発を支援する',
    supportOnKofi: 'Ko-fiでサポート',

    // Disclaimer
    disclaimer: '免責事項',
    disclaimerText: 'このアプリケーションは、ユーザーが自身の責任において使用することを前提としています。本ソフトウェアの使用により生じたいかなる損害、トラブル、法的責任について、制作者は一切の責任を負いません。著作権法および関連法規を遵守し、私的利用の範囲内でご使用ください。',
    aiDisclaimer: 'このアプリケーションは、AIを使用したアプリケーション作成テストとして作成されました。',

    // History
    downloadHistory: 'ダウンロード履歴',
    noHistory: '履歴はありません',
    clearHistory: 'すべて削除',
    openFolder: 'フォルダを開く',
    removeFromHistory: '履歴から削除',
    success: '成功',
    failed: '失敗',
    yesterday: '昨日',
    daysAgo: '{days}日前',
    titleUnknown: 'タイトル不明',
    items: '件',

    // Logs
    logs: 'ログ',
    clearLogs: 'ログをクリア',

    // App Main
    appSubtitle: '高機能動画ダウンローダー',
    preset: 'プリセット',
    binaryNotFound: 'バイナリ (yt-dlp/ffmpeg) がアプリケーションフォルダに見つかりません。設定からダウンロードしてください。',
    startDownload: 'ダウンロード開始',
    processing: '処理中...',
    selectDestination: '保存先フォルダを選択してください。',
    startingDownload: '🚀 ダウンロードプロセスを開始します...',
    downloadCompleteMsg: 'ダウンロードが完了しました！',
    downloadingMsg: 'ダウンロード中です...',
    downloadErrorMsg: 'ダウンロードに失敗しました。ログを確認してください。',
    cancelledMsg: 'キャンセルしました',
    consoleOutput: 'コンソール出力',
    waiting: '待機中...',
    updateComplete: '更新完了',
    updateCancelled: 'キャンセルされました',
    updateFailed: '更新失敗',
    downloadComplete2: 'ダウンロード完了',
    downloadFailed: 'ダウンロード失敗',
    startingYtDlpUpdate: 'yt-dlpの更新を開始します...',
    ytDlpUpdateComplete: 'yt-dlpの更新が完了しました。',
    ytDlpUpdateCancelled: 'yt-dlpの更新がキャンセルされました。',
    ytDlpUpdateFailed: 'yt-dlpの更新に失敗しました。',
    startingFfmpegUpdate: 'ffmpegの更新を開始します...',
    ffmpegUpdateComplete: 'ffmpegの更新が完了しました。',
    ffmpegUpdateCancelled: 'ffmpegの更新がキャンセルされました。',
    ffmpegUpdateFailed: 'ffmpegの更新に失敗しました。',
    startingBinaryDownload: 'バイナリのダウンロードを開始します...',
    binaryDownloadComplete: 'バイナリのダウンロードとセットアップが完了しました。',
    binaryDownloadFailed: 'バイナリのダウンロードに失敗しました。',
    statusDownloadingYtDlp: 'yt-dlpをダウンロード中...',
    statusDownloadingFfmpeg: 'ffmpegをダウンロード中...',
    statusExtracting: '展開中...',
    statusCleaningUp: 'クリーンアップ中...',
    statusYtDlpDownloadComplete: 'yt-dlpのダウンロード完了',
    writeAutoSubtitles: '自動字幕を書き出し',
    playlistAuto: '自動',
    cookiesNone: '使用しない',

    // Video Preview
    fetchingVideoInfo: '動画情報を取得中...',
    views: '回視聴',
    estimatedSize: '推定サイズ',
    previous: '前へ',
    next: '次へ',
    videoInfoError: '動画情報の取得に失敗しました',
    videoInfo: '動画情報',
    enterValidUrl: '有効なURLを入力してください',
    unsupportedUrl: '対応していないURLです',
    noVideoFound: '動画が見つかりませんでした',
    bestQuality: '最高画質',

    // Download Progress
    downloadSpeed: 'ダウンロード速度',
    downloadedSize: 'ダウンロード済み',
    remainingTime: '残り時間',

    // Hardware Encoding
    hardwareEncoder: 'ハードウェアエンコーダー',
    softwareEncoder: 'ソフトウェア（CPU）',
    nvenc: 'NVIDIA NVENC',
    qsv: 'Intel QuickSync',
    videotoolbox: 'Apple VideoToolbox',
    amf: 'AMD AMF',
    encoderAuto: '自動選択',
    hwEncoderNotAvailable: '利用不可',
  },
  en: {
    // App
    appTitle: 'yt-dlp GUI',
    download: 'Download',
    downloading: 'Downloading...',
    cancel: 'Cancel',
    settings: 'Settings',
    history: 'History',

    // URL Input
    downloadUrl: 'Download URL',
    urlPlaceholder: 'https://www.youtube.com/watch?v=...',
    paste: 'Paste',
    clipboardMonitoring: 'Clipboard Monitoring',
    importFile: 'Import from File',
    importFileTooltip: 'Batch import URLs from text file (.txt)',

    // Format Selector
    video: 'Video',
    audio: 'Audio',
    format: 'Format',
    resolution: 'Resolution',
    container: 'Container',
    bitrate: 'Bitrate',
    sampleRate: 'Sample Rate',
    bitDepth: 'Bit Depth',
    best: 'Best',
    auto: 'Auto',

    // Video Conversion
    conversionOptions: 'Conversion Options',
    enableConversion: 'Enable Conversion',
    videoCodec: 'Video Codec',
    audioCodec: 'Audio Codec',
    videoBitrate: 'Video Bitrate',
    audioBitrateConv: 'Audio Bitrate',
    copy: 'Copy (No conversion)',

    // Location Selector
    saveTo: 'Save to',
    selectFolder: 'Select Folder',
    browse: 'Browse',
    folderPathPlaceholder: 'Enter folder path',
    favorites: 'Favorites',
    addToFavorites: 'Add to Favorites',
    removeFromFavorites: 'Remove from Favorites',
    noFavorites: 'No favorite folders',

    // Advanced Options
    advancedOptions: 'Advanced Options',
    embedThumbnail: 'Embed Thumbnail',
    embedMetadata: 'Embed Metadata',
    embedSubtitles: 'Embed Subtitles',
    writeAutoSub: 'Write Auto Subtitles',
    splitChapters: 'Split by Chapters',
    playlist: 'Playlist',
    playlistDefault: 'Auto',
    playlistSingle: 'Single Only',
    playlistAll: 'All in Playlist',
    browserCookies: 'Browser Cookies',
    noCookies: 'Don\'t use',
    audioModeWarning: '⚠️ Subtitle embedding, auto-subtitles, and chapter splitting are not available in audio mode.',
    notAvailableInAudioMode: 'Not available in audio mode',
    customArgs: 'Custom Arguments',
    customArgsPlaceholder: 'e.g., --no-playlist',
    timeRange: 'Time Range Cut',
    startTime: 'Start Time',
    endTime: 'End Time',

    // Status
    idle: 'Idle',
    downloadComplete: 'Download complete',
    downloadError: 'An error occurred',
    downloadCancelled: 'Cancelled',

    // Settings Modal
    settingsTitle: 'Settings',
    general: 'General',
    appearance: 'Appearance',
    binaries: 'Binaries',
    presets: 'Presets',
    info: 'Info',

    // General Settings
    generalSettings: 'General Settings',
    generalSettingsDesc: 'Basic application behavior settings',
    outputTemplate: 'Output Filename Template',
    outputTemplateHelp: 'Specify in yt-dlp output template format.',
    templateDefault: 'Default',
    templateWithDate: 'With Date',
    templateWithUploader: 'With Uploader',
    enableNotifications: 'Enable System Notifications',
    enableNotificationsDesc: 'Show OS notifications on download complete or error',

    // Appearance Settings
    theme: 'Theme',
    appearanceSettings: 'Appearance Settings',
    appearanceSettingsDesc: 'Customize theme and visuals',

    // Binary Settings
    binaryManagement: 'Binary Management',
    binaryDescription: 'Manage yt-dlp and ffmpeg',
    status: 'Status',
    installed: 'Installed',
    notDetected: 'Not Detected',
    checking: 'Checking...',
    version: 'Version',
    latest: 'Latest',
    updateAvailable: 'Update',
    unknown: 'Unknown',
    updateYtDlp: 'Update yt-dlp',
    updateFfmpeg: 'Update ffmpeg',
    downloadBinaries: 'Auto-download Binaries',
    cancelDownload: 'Cancel',

    // Preset Settings
    presetManagement: 'Preset Management',
    presetDescription: 'Save and load frequently used settings',
    presetNamePlaceholder: 'Preset name (e.g., High Quality)',
    save: 'Save',
    noPresets: 'No presets',

    // Info Tab
    appInfo: 'Application Info',
    appVersion: 'App Version',
    author: 'Author',
    checkForUpdates: 'Check for Updates',
    checkingUpdates: 'Checking...',
    newVersionAvailable: 'New version v{version} is available',
    upToDate: 'You are using the latest version',
    openDownloadPage: 'Open Download Page',
    updateCheckFailed: 'Failed to check for updates',

    // Ko-fi
    supportDevelopment: 'Support Development',
    supportOnKofi: 'Support on Ko-fi',

    // Disclaimer
    disclaimer: 'Disclaimer',
    disclaimerText: 'This application is intended to be used at your own risk. The developer is not responsible for any damages, troubles, or legal liabilities arising from the use of this software. Please comply with copyright laws and use within the scope of personal use.',
    aiDisclaimer: 'This application was created as an AI-assisted application development test.',

    // History
    downloadHistory: 'Download History',
    noHistory: 'No history',
    clearHistory: 'Clear All',
    openFolder: 'Open Folder',
    removeFromHistory: 'Remove from History',
    success: 'Success',
    failed: 'Failed',
    yesterday: 'Yesterday',
    daysAgo: '{days} days ago',
    titleUnknown: 'Unknown Title',
    items: 'items',

    // Logs
    logs: 'Logs',
    clearLogs: 'Clear Logs',

    // App Main
    appSubtitle: 'Advanced Video Downloader',
    preset: 'Preset',
    binaryNotFound: 'Binaries (yt-dlp/ffmpeg) not found in application folder. Please download from settings.',
    startDownload: 'Start Download',
    processing: 'Processing...',
    selectDestination: 'Please select a destination folder.',
    startingDownload: '🚀 Starting download process...',
    downloadCompleteMsg: 'Download complete!',
    downloadingMsg: 'Downloading...',
    downloadErrorMsg: 'Download failed. Check logs for details.',
    cancelledMsg: 'Cancelled',
    consoleOutput: 'Console Output',
    waiting: 'Waiting...',
    updateComplete: 'Update Complete',
    updateCancelled: 'Cancelled',
    updateFailed: 'Update Failed',
    downloadComplete2: 'Download Complete',
    downloadFailed: 'Download Failed',
    startingYtDlpUpdate: 'Starting yt-dlp update...',
    ytDlpUpdateComplete: 'yt-dlp update complete.',
    ytDlpUpdateCancelled: 'yt-dlp update cancelled.',
    ytDlpUpdateFailed: 'yt-dlp update failed.',
    startingFfmpegUpdate: 'Starting ffmpeg update...',
    ffmpegUpdateComplete: 'ffmpeg update complete.',
    ffmpegUpdateCancelled: 'ffmpeg update cancelled.',
    ffmpegUpdateFailed: 'ffmpeg update failed.',
    startingBinaryDownload: 'Starting binary download...',
    binaryDownloadComplete: 'Binary download and setup complete.',
    binaryDownloadFailed: 'Binary download failed.',
    statusDownloadingYtDlp: 'Downloading yt-dlp...',
    statusDownloadingFfmpeg: 'Downloading ffmpeg...',
    statusExtracting: 'Extracting...',
    statusCleaningUp: 'Cleaning up...',
    statusYtDlpDownloadComplete: 'yt-dlp download complete',
    writeAutoSubtitles: 'Write Auto Subtitles',
    playlistAuto: 'Auto',
    cookiesNone: 'Don\'t use',

    // Video Preview
    fetchingVideoInfo: 'Fetching video info...',
    views: 'views',
    estimatedSize: 'Est. size',
    previous: 'Previous',
    next: 'Next',
    videoInfoError: 'Failed to fetch video info',
    videoInfo: 'Video Info',
    enterValidUrl: 'Please enter a valid URL',
    unsupportedUrl: 'Unsupported URL',
    noVideoFound: 'No video found',
    bestQuality: 'Best Quality',

    // Download Progress
    downloadSpeed: 'Download speed',
    downloadedSize: 'Downloaded',
    remainingTime: 'Time remaining',

    // Hardware Encoding
    hardwareEncoder: 'Hardware Encoder',
    softwareEncoder: 'Software (CPU)',
    nvenc: 'NVIDIA NVENC',
    qsv: 'Intel QuickSync',
    videotoolbox: 'Apple VideoToolbox',
    amf: 'AMD AMF',
    encoderAuto: 'Auto-select',
    hwEncoderNotAvailable: 'Not available',
  }
};

export type TranslationKey = keyof typeof translations.ja;
