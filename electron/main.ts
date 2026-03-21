import { Notification, app, BrowserWindow, dialog, ipcMain, shell } from 'electron';
import path from 'path';
import fs from 'fs';
import https from 'https';
import { exec, spawn, spawnSync, ChildProcess } from 'child_process';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import { promisify } from 'util';
import type {
  BinaryPresence,
  BinaryUpdateChannel,
  BinaryUpdateProgress,
  DownloadPayload,
  DownloadResult,
  HwEncoderResult,
  InstalledBinaryVersions,
  LatestBinaryVersions,
  PlaylistInfo,
  PreviewError,
  PreviewErrorCode,
  PreviewErrorSource,
  VideoInfo,
  VideoInfoRequest,
  VideoInfoResult
} from '../shared/contracts';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const require = createRequire(import.meta.url);

// Safe require for optional dependencies
let ffmpegStatic: string | null = null;
let ytDlp: { YOUTUBE_DL_PATH?: string } = {};

try {
  ffmpegStatic = require('ffmpeg-static') as string | null;
} catch (e) {
  console.log('ffmpeg-static not available');
}

try {
  ytDlp = require('yt-dlp-exec/src/constants') as { YOUTUBE_DL_PATH?: string };
} catch (e) {
  console.log('yt-dlp-exec not available');
}

const isWindows = process.platform === 'win32';
const previewCache = new Map<string, { expiresAt: number; result: VideoInfoResult }>();
const previewInFlight = new Map<string, Promise<VideoInfoResult>>();
const PREVIEW_CACHE_TTL_MS = 5 * 60 * 1000;
const FAST_PREVIEW_TIMEOUT_MS = 5000;
const YTDLP_PREVIEW_TIMEOUT_MS = 12000;
const LEGACY_BINARY_DIRS = [
  () => path.join(process.resourcesPath, 'Application'),
  () => path.join(process.cwd(), 'Application'),
  () => path.join(app.getPath('userData'), 'Application')
];

interface BinaryProgressData {
  downloaded: number;
  total: number;
  speed: number;
}

interface YtDlpInvocation {
  command: string;
  argsPrefix: string[];
}

const getManagedBinaryDir = () => path.join(app.getPath('userData'), 'bin');

const ensureAppPath = () => {
  const appPath = getManagedBinaryDir();
  if (!fs.existsSync(appPath)) {
    fs.mkdirSync(appPath, { recursive: true });
  }
};

const commandExists = (cmd: string) => {
  try {
    const result = spawnSync(cmd, ['--version'], { windowsHide: true });
    return result.status === 0;
  } catch {
    return false;
  }
};

const buildYtDlpEnv = (): NodeJS.ProcessEnv => {
  const env: NodeJS.ProcessEnv = {
    ...process.env,
    PYTHONIOENCODING: 'utf-8',
    PYTHONUTF8: '1',
  };

  const invocation = resolveYtDlpInvocation();
  if (invocation?.argsPrefix[0] && invocation.command !== invocation.argsPrefix[0]) {
    env.PYTHON = invocation.command;
  }

  const bundledRuntimePath = resolveBundledJsRuntimePath();
  const jsRuntimeArgs = resolveJsRuntimeArgs();
  if (bundledRuntimePath && jsRuntimeArgs[1]?.endsWith(`:${bundledRuntimePath}`)) {
    env.ELECTRON_RUN_AS_NODE = '1';
  }

  return env;
};

const ytDlpBinaryPath = (ytDlp as unknown as { YOUTUBE_DL_PATH?: string }).YOUTUBE_DL_PATH;

const resolveFfprobePath = () => {
  const appPath = getManagedBinaryDir();
  const bundled = path.join(appPath, isWindows ? 'ffprobe.exe' : 'ffprobe');
  if (fs.existsSync(bundled)) return bundled;

  if (ffmpegStatic) {
    const ffprobeStatic = path.join(path.dirname(ffmpegStatic), isWindows ? 'ffprobe.exe' : 'ffprobe');
    if (fs.existsSync(ffprobeStatic)) return ffprobeStatic;
  }

  return commandExists('ffprobe') ? 'ffprobe' : null;
};

const resolveYtDlpPath = () => {
  const appPath = getManagedBinaryDir();
  const bundled = path.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  if (fs.existsSync(bundled)) return bundled;

  if (ytDlpBinaryPath && fs.existsSync(ytDlpBinaryPath)) return ytDlpBinaryPath;
  return commandExists('yt-dlp') ? 'yt-dlp' : null;
};

const resolveFfmpegPath = () => {
  const appPath = getManagedBinaryDir();
  const bundled = path.join(appPath, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  if (fs.existsSync(bundled)) return bundled;

  if (ffmpegStatic && fs.existsSync(ffmpegStatic)) {
    const ffprobeStatic = path.join(path.dirname(ffmpegStatic), isWindows ? 'ffprobe.exe' : 'ffprobe');
    if (fs.existsSync(ffprobeStatic)) {
      return ffmpegStatic;
    }
  }

  return commandExists('ffmpeg') && commandExists('ffprobe') ? 'ffmpeg' : null;
};

const createLineForwarder = (onLine: (line: string) => void) => {
  let buffer = '';

  return (chunk: Buffer | string) => {
    buffer += chunk.toString();
    const lines = buffer.split(/\r\n|\n|\r/g);
    buffer = lines.pop() ?? '';

    for (const rawLine of lines) {
      const line = rawLine.trim();
      if (line) {
        onLine(line);
      }
    }
  };
};

const copyBinary = async (from: string, to: string) => {
  ensureAppPath();
  await fs.promises.copyFile(from, to);
  if (!isWindows) {
    await fs.promises.chmod(to, 0o755);
  }
};

// Global abort controller for binary downloads
let binaryDownloadController: AbortController | null = null;
let activeDownloadProcess: ChildProcess | null = null;
let isDownloadCancelled = false;
let cachedYtDlpPythonPath: string | null | undefined;
let cachedJsRuntimeArgs: string[] | undefined;
let cachedBundledJsRuntimePath: string | null | undefined;

const resolveBundledJsRuntimePath = () => {
  if (cachedBundledJsRuntimePath !== undefined) {
    return cachedBundledJsRuntimePath;
  }

  if (process.versions.electron && process.execPath && fs.existsSync(process.execPath)) {
    cachedBundledJsRuntimePath = process.execPath;
    return cachedBundledJsRuntimePath;
  }

  cachedBundledJsRuntimePath = null;
  return null;
};

const resolveCommandPath = (cmd: string) => {
  const locator = isWindows ? 'where' : 'which';
  try {
    const result = spawnSync(locator, [cmd], {
      windowsHide: true,
      encoding: 'utf8'
    });
    if (result.status !== 0 || !result.stdout) {
      return null;
    }

    return result.stdout
      .split(/\r?\n/)
      .map(line => line.trim())
      .find(Boolean) ?? null;
  } catch {
    return null;
  }
};

const isPythonZipApp = (filePath: string) => {
  if (isWindows || !fs.existsSync(filePath)) {
    return false;
  }

  try {
    const handle = fs.openSync(filePath, 'r');
    const buffer = Buffer.alloc(64);
    const bytesRead = fs.readSync(handle, buffer, 0, buffer.length, 0);
    fs.closeSync(handle);
    const header = buffer.subarray(0, bytesRead).toString('utf8');
    return header.startsWith('#!/usr/bin/env python3');
  } catch {
    return false;
  }
};

const pythonSupportsYtDlp = (pythonPath: string, scriptPath: string) => {
  try {
    const runtimeCheck = spawnSync(
      pythonPath,
      [
        '-c',
        'import hashlib,sys; raise SystemExit(0 if sys.version_info >= (3, 10) and {"blake2b","blake2s"} <= set(hashlib.algorithms_available) else 1)'
      ],
      { windowsHide: true }
    );

    if (runtimeCheck.status !== 0) {
      return false;
    }

    const versionCheck = spawnSync(pythonPath, [scriptPath, '--version'], {
      windowsHide: true,
      encoding: 'utf8'
    });

    return versionCheck.status === 0;
  } catch {
    return false;
  }
};

const resolveYtDlpPythonPath = (scriptPath: string) => {
  if (cachedYtDlpPythonPath !== undefined) {
    return cachedYtDlpPythonPath;
  }

  const candidates = [
    process.env.YTDLP_PYTHON,
    '/opt/homebrew/bin/python3',
    '/opt/homebrew/bin/python3.14',
    '/opt/homebrew/bin/python3.13',
    '/opt/homebrew/bin/python3.12',
    '/opt/homebrew/bin/python3.11',
    '/opt/homebrew/bin/python3.10',
    resolveCommandPath('python3')
  ].filter((value): value is string => !!value);

  for (const candidate of candidates) {
    if (pythonSupportsYtDlp(candidate, scriptPath)) {
      cachedYtDlpPythonPath = candidate;
      return candidate;
    }
  }

  cachedYtDlpPythonPath = null;
  return null;
};

const resolveJsRuntimeArgs = () => {
  if (cachedJsRuntimeArgs) {
    return cachedJsRuntimeArgs;
  }

  const runtimes = [
    { name: 'node', path: resolveBundledJsRuntimePath() },
    { name: 'node', path: resolveCommandPath('node') || '/opt/homebrew/bin/node' },
    { name: 'deno', path: resolveCommandPath('deno') },
    { name: 'bun', path: resolveCommandPath('bun') }
  ];

  for (const runtime of runtimes) {
    if (!runtime.path || !fs.existsSync(runtime.path)) {
      continue;
    }

    cachedJsRuntimeArgs = ['--js-runtimes', `${runtime.name}:${runtime.path}`];
    return cachedJsRuntimeArgs;
  }

  cachedJsRuntimeArgs = [];
  return cachedJsRuntimeArgs;
};

const resolveYtDlpInvocation = () => {
  const ytdlpPath = resolveYtDlpPath();
  if (!ytdlpPath) {
    return null;
  }

  if (isPythonZipApp(ytdlpPath)) {
    const pythonPath = resolveYtDlpPythonPath(ytdlpPath);
    if (pythonPath) {
      return { command: pythonPath, argsPrefix: [ytdlpPath] } satisfies YtDlpInvocation;
    }
  }

  return { command: ytdlpPath, argsPrefix: [] } satisfies YtDlpInvocation;
};

const createBinaryProgressPayload = (
  type: BinaryUpdateChannel,
  percent: number,
  status: string,
  progressData?: BinaryProgressData
) => ({
  type,
  percent,
  status,
  progressData
} satisfies BinaryUpdateProgress);

const createPreviewError = (
  code: PreviewErrorCode,
  source: PreviewErrorSource,
  message: string
): PreviewError => ({
  code,
  source,
  message
});

const normalizePreviewUrl = (rawUrl: string) => {
  const normalized = new URL(rawUrl.trim());
  normalized.hash = '';
  return normalized.toString();
};

const getPreviewCacheKey = (request: VideoInfoRequest) =>
  `${normalizePreviewUrl(request.url)}::${request.cookiesBrowser ?? 'none'}`;

const getCachedPreview = (cacheKey: string) => {
  const cached = previewCache.get(cacheKey);
  if (!cached) {
    return null;
  }

  if (cached.expiresAt < Date.now()) {
    previewCache.delete(cacheKey);
    return null;
  }

  return {
    ...cached.result,
    cached: true
  } satisfies VideoInfoResult;
};

const setCachedPreview = (cacheKey: string, result: VideoInfoResult) => {
  previewCache.set(cacheKey, {
    expiresAt: Date.now() + PREVIEW_CACHE_TTL_MS,
    result
  });
};

const classifyResponseError = (status: number, source: PreviewErrorSource, url: string) => {
  if (status === 401 || status === 403) {
    return createPreviewError('auth_required', source, `Authentication required for ${url}`);
  }

  if (status === 429) {
    return createPreviewError('rate_limited', source, `Rate limited while fetching ${url}`);
  }

  if (status === 404) {
    return createPreviewError('unsupported', source, `URL not found: ${url}`);
  }

  return createPreviewError('network', source, `HTTP ${status} while fetching ${url}`);
};

const classifyThrownError = (error: unknown, source: PreviewErrorSource, fallbackMessage: string) => {
  if (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    'source' in error &&
    'message' in error
  ) {
    return error as PreviewError;
  }

  if (error instanceof Error) {
    if (error.name === 'AbortError') {
      return createPreviewError('timeout', source, `${source === 'fast' ? 'Fast preview' : 'yt-dlp preview'} timed out`);
    }

    return createPreviewError('network', source, error.message || fallbackMessage);
  }

  return createPreviewError('unknown', source, fallbackMessage);
};

const fetchWithTimeout = async (
  requestUrl: string,
  timeoutMs: number,
  headers?: Record<string, string>
) => {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(requestUrl, {
      redirect: 'follow',
      signal: controller.signal,
      headers: {
        'user-agent': 'yt-dlp-gui/1.3',
        'accept-language': 'en-US,en;q=0.9,ja;q=0.8',
        ...headers
      }
    });

    return response;
  } finally {
    clearTimeout(timeout);
  }
};

const fetchJson = async <T>(url: string, timeoutMs = FAST_PREVIEW_TIMEOUT_MS): Promise<T> => {
  const response = await fetchWithTimeout(url, timeoutMs, {
    accept: 'application/json'
  });

  if (!response.ok) {
    throw classifyResponseError(response.status, 'fast', url);
  }

  return response.json() as Promise<T>;
};

const fetchText = async (url: string, timeoutMs: number) => {
  const response = await fetchWithTimeout(url, timeoutMs, {
    accept: 'text/html,application/xhtml+xml'
  });

  if (!response.ok) {
    throw classifyResponseError(response.status, 'fast', url);
  }

  return response.text();
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, '\'')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');

const extractMetaContent = (html: string, attr: 'property' | 'name', key: string) => {
  const match = html.match(new RegExp(`<meta[^>]+${attr}=["']${key}["'][^>]+content=["']([^"']+)["']`, 'i'));
  return match?.[1] ? decodeHtmlEntities(match[1]) : undefined;
};

const extractTitleTag = (html: string) => {
  const match = html.match(/<title>([^<]+)<\/title>/i);
  return match?.[1] ? decodeHtmlEntities(match[1].trim()) : undefined;
};

const extractJsonLdObjects = (html: string) => {
  const matches = html.matchAll(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
  const results: Record<string, any>[] = [];

  for (const match of matches) {
    try {
      const parsed = JSON.parse(match[1].trim());
      if (Array.isArray(parsed)) {
        results.push(...parsed.filter(Boolean));
      } else if (parsed) {
        results.push(parsed);
      }
    } catch {
      continue;
    }
  }

  return results;
};

const parseIsoDuration = (value?: string) => {
  if (!value) return 0;
  const match = value.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/i);
  if (!match) return 0;

  const hours = Number(match[1] ?? 0);
  const minutes = Number(match[2] ?? 0);
  const seconds = Number(match[3] ?? 0);
  return hours * 3600 + minutes * 60 + seconds;
};

const parseNumericString = (value?: string) => {
  if (!value) return undefined;
  const parsed = Number(String(value).replace(/[^\d.]/g, ''));
  return Number.isFinite(parsed) ? parsed : undefined;
};

const getYouTubeId = (value: string) => {
  try {
    const parsed = new URL(value);
    if (parsed.hostname === 'youtu.be') {
      return parsed.pathname.replace(/^\//, '') || null;
    }

    if (parsed.searchParams.get('v')) {
      return parsed.searchParams.get('v');
    }

    const embedMatch = parsed.pathname.match(/\/embed\/([^/]+)/);
    return embedMatch?.[1] ?? null;
  } catch {
    return null;
  }
};

const isLikelyPlaylistUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.pathname.includes('/playlist') || (!!parsed.searchParams.get('list') && !parsed.searchParams.get('v'));
  } catch {
    return false;
  }
};

const getBestResolutionLabel = (html: string) => {
  const heights = new Set<number>();

  for (const match of html.matchAll(/"height":"?(\d{3,4})"?/g)) {
    const height = Number(match[1]);
    if (Number.isFinite(height)) {
      heights.add(height);
    }
  }

  for (const match of html.matchAll(/"qualityLabel":"(\d{3,4})p"/g)) {
    const height = Number(match[1]);
    if (Number.isFinite(height)) {
      heights.add(height);
    }
  }

  if (heights.size === 0) {
    return undefined;
  }

  return toResolutionLabel(Math.max(...heights));
};

const buildVideoInfo = (partial: Partial<VideoInfo> & Pick<VideoInfo, 'id' | 'title' | 'channel'>): VideoInfo => ({
  thumbnail: '',
  duration: 0,
  ...partial
});

const buildFastVideoResult = (video: VideoInfo): VideoInfoResult => ({
  isPlaylist: false,
  fetchedBy: 'fast',
  video
});

const hasUsableFastPreview = (result: VideoInfoResult | null) =>
  !!result?.video?.title && !!result.video.channel;

const isValidTimecode = (value: string) => /^\d{2}:\d{2}:\d{2}$/.test(value);

const buildDownloadSection = (start?: string, end?: string) => {
  const normalizedStart = start?.trim() ?? '';
  const normalizedEnd = end?.trim() ?? '';

  if (normalizedStart && !isValidTimecode(normalizedStart)) {
    return null;
  }

  if (normalizedEnd && !isValidTimecode(normalizedEnd)) {
    return null;
  }

  if (!normalizedStart && !normalizedEnd) {
    return null;
  }

  const rangeStart = normalizedStart || '00:00:00';
  const rangeEnd = normalizedEnd || 'inf';
  return `*${rangeStart}-${rangeEnd}`;
};

const showDownloadNotification = (enabled: boolean, result: DownloadResult) => {
  if (!enabled || !Notification.isSupported()) {
    return;
  }

  const title =
    result.status === 'complete'
      ? 'Download complete'
      : result.status === 'cancelled'
        ? 'Download cancelled'
        : 'Download failed';

  new Notification({
    title,
    body: result.title || result.message
  }).show();
};

const terminateProcessTree = async (proc: ChildProcess | null) => {
  if (!proc?.pid) {
    return;
  }

  if (isWindows) {
    try {
      spawnSync('taskkill', ['/pid', String(proc.pid), '/t', '/f'], {
        windowsHide: true
      });
      return;
    } catch {
      proc.kill();
      return;
    }
  }

  try {
    process.kill(-proc.pid, 'SIGKILL');
  } catch {
    proc.kill('SIGKILL');
  }
};

const extractBestThumbnail = (value: unknown): string | undefined => {
  if (Array.isArray(value)) {
    return value.find((item): item is string => typeof item === 'string');
  }

  return typeof value === 'string' ? value : undefined;
};

const mapYtDlpDataToVideoInfo = (data: any): VideoInfoResult => {
  if (data._type === 'playlist' && Array.isArray(data.entries)) {
    const entries: PlaylistInfo['entries'] = data.entries.slice(0, 50).filter(Boolean).map((entry: any) => {
      const heights = (entry.formats || [])
        .filter((format: any) => format?.height && format?.vcodec && format.vcodec !== 'none')
        .map((format: any) => Number(format.height))
        .filter((height: number) => Number.isFinite(height));

      const bestResolution = heights.length > 0
        ? toResolutionLabel(Math.max(...heights))
        : (entry.height ? toResolutionLabel(Number(entry.height)) : undefined);

      return {
        id: entry.id || entry.url,
        title: entry.title || 'Unknown',
        channel: entry.channel || entry.uploader || data.channel || data.uploader || 'Unknown',
        thumbnail: entry.thumbnail || entry.thumbnails?.[0]?.url || '',
        duration: entry.duration || 0,
        viewCount: entry.view_count,
        filesize: entry.filesize || entry.filesize_approx,
        bestResolution,
      };
    });

    return {
      isPlaylist: true,
      fetchedBy: 'yt_dlp',
      playlist: {
        id: data.id,
        title: data.title,
        channel: data.channel || data.uploader || 'Unknown',
        thumbnail: data.thumbnail || data.thumbnails?.[0]?.url || entries[0]?.thumbnail,
        videoCount: data.playlist_count || entries.length,
        entries,
      }
    };
  }

  const formats = (data.formats || []).map((format: any) => ({
    format_id: format.format_id,
    ext: format.ext,
    resolution: format.resolution || (format.height ? `${format.width}x${format.height}` : undefined),
    height: format.height,
    filesize: format.filesize,
    filesize_approx: format.filesize_approx,
    vcodec: format.vcodec,
    acodec: format.acodec,
    tbr: format.tbr,
    abr: format.abr,
  }));

  const heights = formats
    .filter((format: any) => format?.height && format?.vcodec && format.vcodec !== 'none')
    .map((format: any) => Number(format.height))
    .filter((height: number) => Number.isFinite(height));

  const bestResolution = heights.length > 0
    ? toResolutionLabel(Math.max(...heights))
    : undefined;

  let estimatedSize = 0;
  const videoFormats = formats.filter((format: any) => format.vcodec && format.vcodec !== 'none');
  const audioFormats = formats.filter((format: any) => format.acodec && format.acodec !== 'none' && (!format.vcodec || format.vcodec === 'none'));

  if (videoFormats.length > 0) {
    const bestVideo = videoFormats.sort((a: any, b: any) =>
      (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0)
    )[0];
    estimatedSize += bestVideo.filesize || bestVideo.filesize_approx || 0;
  }

  if (audioFormats.length > 0) {
    const bestAudio = audioFormats.sort((a: any, b: any) =>
      (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0)
    )[0];
    estimatedSize += bestAudio.filesize || bestAudio.filesize_approx || 0;
  }

  return {
    isPlaylist: false,
    fetchedBy: 'yt_dlp',
    video: {
      id: data.id,
      title: data.title || 'Unknown',
      channel: data.channel || data.uploader || 'Unknown',
      channelUrl: data.channel_url || data.uploader_url,
      thumbnail: data.thumbnail || data.thumbnails?.slice(-1)?.[0]?.url || '',
      duration: data.duration || 0,
      viewCount: data.view_count,
      uploadDate: data.upload_date,
      description: data.description?.substring(0, 200),
      filesize: estimatedSize || data.filesize || data.filesize_approx,
      formats,
      bestResolution,
    }
  };
};

const classifyYtDlpPreviewError = (stderr: string) => {
  const message = stderr.trim() || 'Failed to fetch video info';
  const lower = message.toLowerCase();

  if (lower.includes('sign in') || lower.includes('login') || lower.includes('cookies') || lower.includes('private')) {
    return createPreviewError('auth_required', 'yt_dlp', message);
  }

  if (lower.includes('429') || lower.includes('too many requests') || lower.includes('rate limit')) {
    return createPreviewError('rate_limited', 'yt_dlp', message);
  }

  if (lower.includes('unsupported') || lower.includes('no suitable extractor')) {
    return createPreviewError('unsupported', 'yt_dlp', message);
  }

  if (lower.includes('timed out') || lower.includes('timeout')) {
    return createPreviewError('timeout', 'yt_dlp', message);
  }

  return createPreviewError('unknown', 'yt_dlp', message);
};

const fetchVideoInfoWithYtDlp = async (request: VideoInfoRequest): Promise<VideoInfoResult> => {
  const ytDlpInvocation = resolveYtDlpInvocation();

  if (!ytDlpInvocation) {
    throw createPreviewError('unsupported', 'yt_dlp', 'yt-dlp not found');
  }

  const args = [
    ...ytDlpInvocation.argsPrefix,
    request.url,
    '-J',
    '--playlist-end', '50',
    '--ignore-errors',
    '--no-warnings',
    '--encoding', 'utf-8',
  ];

  if (request.cookiesBrowser && request.cookiesBrowser !== 'none') {
    args.push('--cookies-from-browser', request.cookiesBrowser);
  }

  args.push(...resolveJsRuntimeArgs());

  const spawnEnv = buildYtDlpEnv();

  const result = await new Promise<{ stdout: string; stderr: string }>((resolve, reject) => {
    let stdout = '';
    let stderr = '';

    const proc = spawn(ytDlpInvocation.command, args, { windowsHide: true, env: spawnEnv });

    proc.stdout?.setEncoding('utf8');
    proc.stdout?.on('data', (data: string) => {
      stdout += data;
    });

    proc.stderr?.setEncoding('utf8');
    proc.stderr?.on('data', (data: string) => {
      stderr += data;
    });

    const timeout = setTimeout(() => {
      void terminateProcessTree(proc);
      reject(createPreviewError('timeout', 'yt_dlp', 'yt-dlp preview timed out'));
    }, YTDLP_PREVIEW_TIMEOUT_MS);

    proc.on('close', (code) => {
      clearTimeout(timeout);
      if (stdout.trim()) {
        resolve({ stdout, stderr });
        return;
      }

      if (code === 0) {
        resolve({ stdout, stderr });
        return;
      }

      reject(classifyYtDlpPreviewError(stderr || `Process exited with code ${code}`));
    });

    proc.on('error', (error) => {
      clearTimeout(timeout);
      reject(createPreviewError('network', 'yt_dlp', error.message));
    });
  });

  const data = JSON.parse(result.stdout);
  return mapYtDlpDataToVideoInfo(data);
};

const fetchFastYouTubePreview = async (url: string): Promise<VideoInfoResult | null> => {
  if (isLikelyPlaylistUrl(url)) {
    return null;
  }

  const videoId = getYouTubeId(url);
  if (!videoId) {
    return null;
  }

  const oEmbedUrl = `https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`;
  const [oEmbedResult, htmlResult] = await Promise.allSettled([
    fetchJson<{ title?: string; author_name?: string; thumbnail_url?: string }>(oEmbedUrl, FAST_PREVIEW_TIMEOUT_MS),
    fetchText(url, FAST_PREVIEW_TIMEOUT_MS)
  ]);

  if (oEmbedResult.status !== 'fulfilled') {
    throw classifyThrownError(oEmbedResult.reason, 'fast', 'Failed to fetch YouTube preview');
  }

  const html = htmlResult.status === 'fulfilled' ? htmlResult.value : '';
  const jsonLdObjects = html ? extractJsonLdObjects(html) : [];
  const videoObject = jsonLdObjects.find(item => item?.['@type'] === 'VideoObject');
  const interactionStatistic = Array.isArray(videoObject?.interactionStatistic)
    ? videoObject.interactionStatistic[0]
    : videoObject?.interactionStatistic;
  const lengthSecondsMatch = html.match(/"lengthSeconds":"(\d+)"/);

  return buildFastVideoResult(buildVideoInfo({
    id: videoId,
    title: oEmbedResult.value.title || videoObject?.name || extractTitleTag(html) || `YouTube Video ${videoId}`,
    channel: oEmbedResult.value.author_name || videoObject?.author?.name || 'YouTube',
    thumbnail: oEmbedResult.value.thumbnail_url || extractBestThumbnail(videoObject?.thumbnailUrl) || '',
    duration: parseIsoDuration(videoObject?.duration) || Number(lengthSecondsMatch?.[1] || 0),
    uploadDate: videoObject?.uploadDate,
    viewCount: parseNumericString(interactionStatistic?.userInteractionCount),
    bestResolution: getBestResolutionLabel(html)
  }));
};

const fetchFastGenericPreview = async (url: string): Promise<VideoInfoResult | null> => {
  const html = await fetchText(url, FAST_PREVIEW_TIMEOUT_MS);
  const jsonLdObjects = extractJsonLdObjects(html);
  const videoObject = jsonLdObjects.find(item => item?.['@type'] === 'VideoObject' || item?.['@type']?.includes?.('VideoObject'));
  const title =
    extractMetaContent(html, 'property', 'og:title') ||
    extractMetaContent(html, 'name', 'twitter:title') ||
    videoObject?.name ||
    extractTitleTag(html);

  if (!title) {
    return null;
  }

  const parsedUrl = new URL(url);
  const channel =
    videoObject?.author?.name ||
    extractMetaContent(html, 'name', 'author') ||
    extractMetaContent(html, 'property', 'og:site_name') ||
    parsedUrl.hostname.replace(/^www\./, '');

  return buildFastVideoResult(buildVideoInfo({
    id: url,
    title,
    channel,
    thumbnail:
      extractMetaContent(html, 'property', 'og:image') ||
      extractMetaContent(html, 'name', 'twitter:image') ||
      extractBestThumbnail(videoObject?.thumbnailUrl) ||
      '',
    duration:
      parseNumericString(extractMetaContent(html, 'property', 'video:duration')) ||
      parseNumericString(extractMetaContent(html, 'property', 'og:video:duration')) ||
      parseIsoDuration(videoObject?.duration) ||
      0,
    uploadDate: videoObject?.uploadDate,
    description: extractMetaContent(html, 'property', 'og:description') || extractMetaContent(html, 'name', 'description'),
    viewCount: parseNumericString(videoObject?.interactionStatistic?.userInteractionCount)
  }));
};

const fetchFastPreview = async (request: VideoInfoRequest): Promise<VideoInfoResult | null> => {
  const normalizedUrl = normalizePreviewUrl(request.url);
  const hostname = new URL(normalizedUrl).hostname.replace(/^www\./, '');

  if (hostname === 'youtube.com' || hostname.endsWith('.youtube.com') || hostname === 'youtu.be') {
    return fetchFastYouTubePreview(normalizedUrl);
  }

  return fetchFastGenericPreview(normalizedUrl);
};

const downloadFile = (url: string, destination: string, onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void) =>
  new Promise<void>((resolve, reject) => {
    ensureAppPath();

    const makeRequest = (requestUrl: string) => {
      const file = fs.createWriteStream(destination);

      const req = https.get(requestUrl, (res: any) => {
        // Handle redirects
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          file.close();
          fs.unlink(destination, () => { }); // Clean up empty file
          let redirectUrl = res.headers.location;
          if (redirectUrl.startsWith('/')) {
            const parsedUrl = new URL(requestUrl);
            redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${redirectUrl}`;
          } else if (!redirectUrl.startsWith('http')) {
            const parsedUrl = new URL(requestUrl);
            const pathParts = parsedUrl.pathname.split('/');
            pathParts.pop();
            redirectUrl = `${parsedUrl.protocol}//${parsedUrl.host}${pathParts.join('/')}/${redirectUrl}`;
          }
          makeRequest(redirectUrl);
          return;
        }

        if (res.statusCode && res.statusCode >= 400) {
          file.close();
          reject(new Error(`HTTP Error: ${res.statusCode}`));
          return;
        }

        // Track progress
        const totalSize = parseInt(res.headers['content-length'] || '0', 10);
        let downloaded = 0;
        const startTime = Date.now();
        let lastUpdate = 0;

        res.on('data', (chunk: Buffer) => {
          downloaded += chunk.length;
          const now = Date.now();

          // Update every 100ms to avoid excessive IPC
          if (now - lastUpdate > 100 || downloaded === totalSize) {
            const elapsed = (now - startTime) / 1000; // seconds
            const speed = elapsed > 0 ? downloaded / elapsed : 0; // bytes/sec

            if (onProgress) {
              if (totalSize > 0) {
                onProgress(Math.round((downloaded / totalSize) * 100), downloaded, totalSize, speed);
              } else {
                // No content-length, report bytes downloaded
                onProgress(-1, downloaded, 0, speed);
              }
            }
            lastUpdate = now;
          }
        });

        res.pipe(file);
        file.on('finish', () => {
          file.close(() => {
            if (!isWindows && fs.existsSync(destination)) {
              try {
                fs.chmodSync(destination, 0o755);
              } catch (e) {
                // Ignore chmod errors, especially for zip files or if file is missing
              }
            }
            resolve();
          });
        });
      });

      req.on('error', (err) => {
        file.close();
        // Only unlink if file exists to avoid ENOENT
        if (fs.existsSync(destination)) {
          fs.unlink(destination, () => reject(err));
        } else {
          reject(err);
        }
      });

      // Handle abort
      if (binaryDownloadController) {
        binaryDownloadController.signal.addEventListener('abort', () => {
          req.destroy();
          file.close();
          if (fs.existsSync(destination)) {
            fs.unlink(destination, () => { });
          }
          reject(new Error('Download cancelled'));
        });
      }
    };

    makeRequest(url);
  });

const downloadYtDlp = async (onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void) => {
  const appPath = getManagedBinaryDir();
  const target = path.join(appPath, isWindows ? 'yt-dlp.exe' : 'yt-dlp');
  const url = isWindows
    ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp.exe'
    : process.platform === 'darwin'
      ? 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp_macos'
      : 'https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp';
  await downloadFile(url, target, onProgress);
  onProgress?.(100, 0, 0, 0);
  return target;
};

const resolveFfmpegBinAssetName = () => {
  const platform = (() => {
    switch (process.platform) {
      case 'darwin':
        return 'osx';
      case 'linux':
        return 'linux';
      case 'win32':
        return 'windows';
      default:
        return null;
    }
  })();

  const arch = (() => {
    switch (process.arch) {
      case 'x64':
        return 'x64';
      case 'arm64':
        return 'arm64';
      case 'ia32':
        return 'x86';
      default:
        return null;
    }
  })();

  if (!platform || !arch) {
    return null;
  }

  return `ffmpeg-${platform}-${arch}.zip`;
};

const extractFfmpegZip = async (zipPath: string, targetDir: string) => {
  const AdmZip = require('adm-zip');
  const zip = new AdmZip(zipPath);
  const entries = zip.getEntries();
  const neededNames = new Set(isWindows ? ['ffmpeg.exe', 'ffprobe.exe'] : ['ffmpeg', 'ffprobe']);

  for (const entry of entries) {
    const entryName = path.posix.basename(entry.entryName);
    if (!neededNames.has(entryName)) {
      continue;
    }

    zip.extractEntryTo(entry, targetDir, false, true);
    const extractedPath = path.join(targetDir, entryName);
    if (!isWindows && fs.existsSync(extractedPath)) {
      fs.chmodSync(extractedPath, 0o755);
    }
  }
};

const removeIfExists = async (targetPath: string) => {
  if (!fs.existsSync(targetPath)) {
    return;
  }

  await fs.promises.rm(targetPath, { recursive: true, force: true });
};

const installStagedFfmpegBinaries = async (
  stagedFfmpegPath: string,
  stagedFfprobePath: string,
  ffmpegTarget: string,
  ffprobeTarget: string
) => {
  const ffmpegBackup = `${ffmpegTarget}.bak`;
  const ffprobeBackup = `${ffprobeTarget}.bak`;

  await removeIfExists(ffmpegBackup);
  await removeIfExists(ffprobeBackup);

  const hadFfmpeg = fs.existsSync(ffmpegTarget);
  const hadFfprobe = fs.existsSync(ffprobeTarget);

  if (hadFfmpeg) {
    await fs.promises.rename(ffmpegTarget, ffmpegBackup);
  }
  if (hadFfprobe) {
    await fs.promises.rename(ffprobeTarget, ffprobeBackup);
  }

  try {
    await fs.promises.rename(stagedFfmpegPath, ffmpegTarget);
    await fs.promises.rename(stagedFfprobePath, ffprobeTarget);
    await removeIfExists(ffmpegBackup);
    await removeIfExists(ffprobeBackup);
  } catch (error) {
    await removeIfExists(ffmpegTarget);
    await removeIfExists(ffprobeTarget);

    if (fs.existsSync(ffmpegBackup)) {
      await fs.promises.rename(ffmpegBackup, ffmpegTarget);
    }
    if (fs.existsSync(ffprobeBackup)) {
      await fs.promises.rename(ffprobeBackup, ffprobeTarget);
    }

    throw error;
  }
};

const downloadFfmpeg = async (onProgress?: (percent: number, downloaded: number, total: number, speed: number) => void, onStatus?: (status: string) => void) => {
  const appPath = getManagedBinaryDir();
  const ffmpegTarget = path.join(appPath, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  const ffprobeTarget = path.join(appPath, isWindows ? 'ffprobe.exe' : 'ffprobe');
  const assetName = resolveFfmpegBinAssetName();
  if (!assetName) {
    throw new Error(`Unsupported platform or architecture for ffmpeg download: ${process.platform}/${process.arch}`);
  }

  const url = `https://github.com/Tyrrrz/FFmpegBin/releases/latest/download/${assetName}`;
  const tempFile = path.join(appPath, 'ffmpeg-temp.zip');
  const stagingDir = path.join(appPath, `ffmpeg-stage-${Date.now()}`);
  const stagedFfmpegPath = path.join(stagingDir, isWindows ? 'ffmpeg.exe' : 'ffmpeg');
  const stagedFfprobePath = path.join(stagingDir, isWindows ? 'ffprobe.exe' : 'ffprobe');

  try {
    await removeIfExists(stagingDir);
    await fs.promises.mkdir(stagingDir, { recursive: true });

    onStatus?.(`ffmpeg をダウンロード中 (${assetName})...`);
    await downloadFile(url, tempFile, (p, downloaded, total, speed) => {
      if (p >= 0) {
        onProgress?.(Math.round(p * 0.8), downloaded, total, speed);
      } else if (downloaded) {
        onProgress?.(-1, downloaded, total, speed);
      }
    });

    onStatus?.('ffmpeg/ffprobe を展開中...');
    onProgress?.(85, 0, 0, 0);

    await extractFfmpegZip(tempFile, stagingDir);

    if (!fs.existsSync(stagedFfmpegPath) || !fs.existsSync(stagedFfprobePath)) {
      throw new Error(`FFmpegBin archive did not contain expected binaries for ${process.platform}/${process.arch}`);
    }

    if (process.platform === 'darwin') {
      try {
        await execAsync(`xattr -d com.apple.quarantine "${stagedFfmpegPath}"`);
      } catch { }
      try {
        await execAsync(`xattr -d com.apple.quarantine "${stagedFfprobePath}"`);
      } catch { }
    }

    await installStagedFfmpegBinaries(stagedFfmpegPath, stagedFfprobePath, ffmpegTarget, ffprobeTarget);

    onProgress?.(95, 0, 0, 0);
    onStatus?.('クリーンアップ中...');

    // Clean up temp file
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    await removeIfExists(stagingDir);

    onProgress?.(100, 0, 0, 0);

    return ffmpegTarget;
  } catch (e) {
    // Clean up on failure
    if (fs.existsSync(tempFile)) {
      fs.unlinkSync(tempFile);
    }
    await removeIfExists(stagingDir);
    throw e;
  }
};

const installFfmpeg = async () => {
  return downloadFfmpeg();
};

const formatProgressDetails = (downloaded: number, total: number, speed: number) => {
  const mbDownloaded = (downloaded / 1024 / 1024).toFixed(1);
  const mbTotal = (total / 1024 / 1024).toFixed(1);
  const mbSpeed = (speed / 1024 / 1024).toFixed(1);

  if (total > 0) {
    return `${mbDownloaded}MB / ${mbTotal}MB (${mbSpeed} MB/s)`;
  } else {
    return `${mbDownloaded}MB (${mbSpeed} MB/s)`;
  }
};

const createWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 900,
    height: 700,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
    titleBarStyle: 'hidden',
    titleBarOverlay: {
      color: '#00000000',
      symbolColor: '#ffffff',
      height: 30,
    },
    backgroundColor: '#1a1a1a',
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../../dist/index.html'));
  }
};

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('select-directory', async () => {
  const [window] = BrowserWindow.getAllWindows();
  const result = await dialog.showOpenDialog(window ?? undefined, {
    properties: ['openDirectory'],
  });
  if (result.canceled) return null;
  return result.filePaths[0];
});

ipcMain.handle('open-file-dialog', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Text Files', extensions: ['txt'] }],
  });

  if (result.canceled || result.filePaths.length === 0) {
    return null;
  }

  try {
    const filePath = result.filePaths[0];
    const content = fs.readFileSync(filePath, 'utf-8');
    return { content, filePath };
  } catch (error) {
    console.error('Failed to read imported URL file', error);
    return null;
  }
});

ipcMain.handle('get-default-download-path', () => {
  return app.getPath('downloads');
});

ipcMain.handle('get-app-version', () => {
  return app.getVersion();
});

ipcMain.handle('migrate-legacy-binaries', async () => {
  const copied: string[] = [];
  const sources: string[] = [];

  try {
    ensureAppPath();

    const binaries = isWindows
      ? ['yt-dlp.exe', 'ffmpeg.exe', 'ffprobe.exe']
      : ['yt-dlp', 'ffmpeg', 'ffprobe'];

    const targetDir = getManagedBinaryDir();
    const legacyDirs = LEGACY_BINARY_DIRS
      .map(getPath => {
        try {
          return getPath();
        } catch {
          return null;
        }
      })
      .filter((value): value is string => !!value)
      .filter(dir => dir !== targetDir);

    for (const binary of binaries) {
      const target = path.join(targetDir, binary);
      if (fs.existsSync(target)) {
        continue;
      }

      for (const legacyDir of legacyDirs) {
        const source = path.join(legacyDir, binary);
        if (!fs.existsSync(source)) {
          continue;
        }

        await copyBinary(source, target);
        copied.push(binary);
        sources.push(source);
        break;
      }
    }

    return {
      migrated: copied.length > 0,
      copied,
      sources,
      skipped: copied.length === 0 ? 'no legacy binaries copied' : undefined
    };
  } catch (error: any) {
    console.error('Failed to migrate legacy binaries', error);
    return {
      migrated: false,
      copied,
      sources,
      error: error?.message ?? 'unknown error'
    };
  }
});

ipcMain.handle('get-latest-binary-versions', async (): Promise<LatestBinaryVersions> => {
  const latest: LatestBinaryVersions = {
    ytDlp: { latestKnown: false, version: null },
    ffmpeg: { latestKnown: false, version: null }
  };

  try {
    const ytDlpRelease = await fetchJson<{ tag_name?: string }>(
      'https://api.github.com/repos/yt-dlp/yt-dlp/releases/latest',
      FAST_PREVIEW_TIMEOUT_MS
    );
    if (ytDlpRelease?.tag_name) {
      latest.ytDlp = {
        latestKnown: true,
        version: ytDlpRelease.tag_name
      };
    }
  } catch (e) {
    console.error('Failed to fetch yt-dlp latest version', e);
  }

  try {
    const ffmpegRelease = await fetchJson<{ tag_name?: string }>(
      'https://api.github.com/repos/Tyrrrz/FFmpegBin/releases/latest',
      FAST_PREVIEW_TIMEOUT_MS
    );
    if (ffmpegRelease?.tag_name) {
      latest.ffmpeg = {
        latestKnown: true,
        version: ffmpegRelease.tag_name
      };
    }
  } catch (e) {
    console.error('Failed to fetch ffmpeg latest version', e);
  }

  return latest;
});

ipcMain.handle('cancel-download', () => {
  if (activeDownloadProcess) {
    isDownloadCancelled = true;
    void terminateProcessTree(activeDownloadProcess);
    return true;
  }
  return false;
});

ipcMain.handle('check-binaries', async (): Promise<BinaryPresence> => {
  const ytDlpPath = resolveYtDlpPath();
  const ffmpegPath = resolveFfmpegPath();
  const ffprobePath = resolveFfprobePath();
  return {
    ytDlp: !!ytDlpPath,
    ffmpeg: !!ffmpegPath,
    ffprobe: !!ffprobePath,
    managedPath: getManagedBinaryDir()
  };
});

ipcMain.handle('get-binary-versions', async (): Promise<InstalledBinaryVersions> => {
  const ytDlpInvocation = resolveYtDlpInvocation();
  const ffmpegPath = resolveFfmpegPath();
  const ytDlpPath = resolveYtDlpPath();
  const versions: InstalledBinaryVersions = {
    ytDlp: {
      detected: !!ytDlpPath,
      version: null,
      path: ytDlpPath
    },
    ffmpeg: {
      detected: !!ffmpegPath,
      version: null,
      path: ffmpegPath
    }
  };

  if (ytDlpInvocation) {
    try {
      const result = spawnSync(
        ytDlpInvocation.command,
        [...ytDlpInvocation.argsPrefix, '--version'],
        {
          windowsHide: true,
          encoding: 'utf8',
          env: buildYtDlpEnv()
        }
      );

      if (result.status === 0) {
        versions.ytDlp.version = result.stdout.trim();
      }
    } catch (e) {
      console.error('Error getting yt-dlp version:', e);
    }
  }

  if (ffmpegPath) {
    try {
      const { stdout } = await execAsync(`"${ffmpegPath}" -version`);
      const firstLine = stdout.split('\n')[0];
      const match = firstLine.match(/ffmpeg version (\S+)/);
      versions.ffmpeg.version = match ? match[1] : firstLine;
    } catch (e) {
      console.error('Error getting ffmpeg version:', e);
    }
  }

  return versions;
});

ipcMain.handle('update-ytdlp', async (event) => {
  try {
    binaryDownloadController = new AbortController();
    const [window] = BrowserWindow.getAllWindows();
    let currentStatus = 'yt-dlp をダウンロード中...';
    const sendProgress = (percent: number, status: string, progressData?: BinaryProgressData) => {
      window?.webContents.send('binary-update-progress', createBinaryProgressPayload('ytdlp', percent, status, progressData));
    };
    sendProgress(0, currentStatus);
    await downloadYtDlp((percent, downloaded, total, speed) => {
      const progressData = { downloaded, total, speed };
      if (percent >= 0) {
        const details = formatProgressDetails(downloaded, total, speed);
        sendProgress(percent, `${currentStatus} ${percent}% - ${details}`, progressData);
      } else if (downloaded) {
        const details = formatProgressDetails(downloaded, 0, speed);
        sendProgress(-1, `${currentStatus} ${details}`, progressData);
      }
    });
    binaryDownloadController = null;
    // Send null to clear progress (indicates completion)
    window?.webContents.send('binary-update-progress', null);
    return true;
  } catch (error: any) {
    binaryDownloadController = null;
    const [window] = BrowserWindow.getAllWindows();
    window?.webContents.send('binary-update-progress', null);
    if (error?.message === 'Download cancelled') {
      return 'cancelled';
    }
    console.error('Failed to update yt-dlp', error);
    return false;
  }
});

ipcMain.handle('update-ffmpeg', async (event) => {
  try {
    binaryDownloadController = new AbortController();
    const [window] = BrowserWindow.getAllWindows();
    let currentStatus = 'ffmpeg をダウンロード中...';
    const sendProgress = (percent: number, status: string, progressData?: BinaryProgressData) => {
      window?.webContents.send('binary-update-progress', createBinaryProgressPayload('ffmpeg', percent, status, progressData));
    };
    sendProgress(0, currentStatus);
    await downloadFfmpeg(
      (percent, downloaded, total, speed) => {
        const progressData = { downloaded, total, speed };
        if (percent >= 0) {
          const details = formatProgressDetails(downloaded, total, speed);
          sendProgress(percent, `${currentStatus} ${percent}% - ${details}`, progressData);
        } else if (downloaded) {
          const details = formatProgressDetails(downloaded, 0, speed);
          sendProgress(-1, `${currentStatus} ${details}`, progressData);
        }
      },
      (status) => {
        currentStatus = status;
        sendProgress(-2, status); // -2 indicates status change only
      }
    );
    binaryDownloadController = null;
    // Send null to clear progress (indicates completion)
    window?.webContents.send('binary-update-progress', null);
    return true;
  } catch (error: any) {
    binaryDownloadController = null;
    const [window] = BrowserWindow.getAllWindows();
    window?.webContents.send('binary-update-progress', null);
    if (error?.message === 'Download cancelled') {
      return 'cancelled';
    }
    console.error('Failed to update ffmpeg', error);
    return false;
  }
});

// Cancel binary download
ipcMain.handle('cancel-binary-download', () => {
  if (binaryDownloadController) {
    binaryDownloadController.abort();
    binaryDownloadController = null;
    return true;
  }
  return false;
});

ipcMain.handle('download-binaries', async () => {
  try {
    binaryDownloadController = new AbortController();
    const [window] = BrowserWindow.getAllWindows();
    let currentStatus = 'yt-dlp をダウンロード中...';

    const sendProgress = (percent: number, status: string, progressData?: BinaryProgressData) => {
      window?.webContents.send('binary-update-progress', createBinaryProgressPayload('all', percent, status, progressData));
    };

    sendProgress(0, currentStatus);

    // 1. Download yt-dlp (0-20%)
    await downloadYtDlp((percent, downloaded, total, speed) => {
      const progressData = { downloaded, total, speed };
      if (percent >= 0) {
        // Map 0-100% to 0-20%
        const overallPercent = Math.round(percent * 0.2);
        const details = formatProgressDetails(downloaded, total, speed);
        sendProgress(overallPercent, `${currentStatus} ${percent}% - ${details}`, progressData);
      } else if (downloaded) {
        const details = formatProgressDetails(downloaded, 0, speed);
        sendProgress(-1, `${currentStatus} ${details}`, progressData);
      }
    });

    sendProgress(20, 'yt-dlp のダウンロード完了');

    // 2. Download ffmpeg (20-100%)
    currentStatus = 'ffmpeg をダウンロード中...';
    await downloadFfmpeg(
      (percent, downloaded, total, speed) => {
        const progressData = { downloaded, total, speed };
        if (percent >= 0) {
          // Map 0-100% to 20-100% (range of 80%)
          const overallPercent = 20 + Math.round(percent * 0.8);
          const details = formatProgressDetails(downloaded, total, speed);
          sendProgress(overallPercent, `${currentStatus} ${percent}% - ${details}`, progressData);
        } else if (downloaded) {
          const details = formatProgressDetails(downloaded, 0, speed);
          sendProgress(-1, `${currentStatus} ${details}`, progressData);
        }
      },
      (status) => {
        currentStatus = status;
        sendProgress(-2, status);
      }
    );

    binaryDownloadController = null;
    window?.webContents.send('binary-update-progress', null);
    return true;
  } catch (error: any) {
    binaryDownloadController = null;
    const [window] = BrowserWindow.getAllWindows();
    window?.webContents.send('binary-update-progress', null);
    if (error?.message === 'Download cancelled') {
      return 'cancelled';
    }
    console.error('Failed to download binaries', error);
    return false;
  }
});

ipcMain.on('open-folder', (_event, folderPath: string) => {
  shell.openPath(folderPath);
});

ipcMain.on('download', async (event, payload: DownloadPayload) => {
  const ytDlpInvocation = resolveYtDlpInvocation();
  const ffmpegPath = resolveFfmpegPath();
  const ffprobePath = resolveFfprobePath();
  const jsRuntimeArgs = resolveJsRuntimeArgs();
  const titleMarker = '__YTDLP_GUI_TITLE__:';
  const pathMarker = '__YTDLP_GUI_PATH__:';

  if (!ytDlpInvocation) {
    const result: DownloadResult = {
      status: 'error',
      success: false,
      message: 'yt-dlp が見つかりませんでした。'
    };
    event.reply('download-complete', result);
    showDownloadNotification(payload.notificationsEnabled, result);
    return;
  }

  // Check execution permissions
  try {
    if (!isWindows && ytDlpInvocation.argsPrefix.length === 0) {
      fs.accessSync(ytDlpInvocation.command, fs.constants.X_OK);
    }
  } catch (e) {
    try {
      fs.chmodSync(ytDlpInvocation.command, 0o755);
    } catch (e2: any) {
      const result: DownloadResult = {
        status: 'error',
        success: false,
        message: `yt-dlp の実行権限がありません: ${e2.message}`
      };
      event.reply('download-complete', result);
      showDownloadNotification(payload.notificationsEnabled, result);
      return;
    }
  }

  if (payload.advancedOptions.timeRange?.enabled) {
    const section = buildDownloadSection(
      payload.advancedOptions.timeRange.start,
      payload.advancedOptions.timeRange.end
    );

    if (!section) {
      const result: DownloadResult = {
        status: 'error',
        success: false,
        message: '時間指定の形式が正しくありません。HH:MM:SS で入力してください。'
      };
      event.reply('download-complete', result);
      showDownloadNotification(payload.notificationsEnabled, result);
      return;
    }
  }

  event.reply('download-progress', '📥 yt-dlpを呼び出しています...');
  event.reply('download-progress', `🔗 URL: ${payload.url}`);
  event.reply('download-progress', `🛠 yt-dlp Path: ${[ytDlpInvocation.command, ...ytDlpInvocation.argsPrefix].join(' ')}`);
  if (jsRuntimeArgs.length >= 2) {
    event.reply('download-progress', `🧠 JS Runtime: ${jsRuntimeArgs[1]}`);
  }

  const outputPath = path.join(payload.location, payload.outputTemplate || '%(title)s.%(ext)s');

  const args: string[] = [
    ...ytDlpInvocation.argsPrefix,
    payload.url,
    '-o',
    outputPath,
    '--no-mtime',
    '--newline',
    '--print', `before_dl:${titleMarker}%(title)s`,
    '--print', `after_move:${pathMarker}%(filepath)s`,
  ];

  if (jsRuntimeArgs.length > 0) {
    args.push(...jsRuntimeArgs);
  }

  if (ffmpegPath && ffprobePath && ffmpegPath !== 'ffmpeg') {
    args.push('--ffmpeg-location', path.dirname(ffmpegPath));
  }

  // Advanced options (only for video mode or applicable audio options)
  if (payload.advancedOptions.embedThumbnail) {
    const shouldSkipThumbnailEmbed =
      payload.options.type === 'audio' &&
      payload.options.audioFormat === 'wav';

    if (shouldSkipThumbnailEmbed) {
      event.reply('download-progress', '⚠️ WAV ではサムネイル埋め込みをスキップします。');
    } else if (payload.options.type === 'audio') {
      args.push('--convert-thumbnails', 'jpg');
      args.push('--embed-thumbnail');
    } else {
      args.push('--embed-thumbnail');
    }
  }
  if (payload.advancedOptions.addMetadata) args.push('--add-metadata');

  // Video-only options
  if (payload.options.type === 'video') {
    if (payload.advancedOptions.embedSubs) args.push('--embed-subs');
    if (payload.advancedOptions.writeAutoSub) args.push('--write-auto-sub');
    if (payload.advancedOptions.splitChapters) args.push('--split-chapters');
  }

  if (payload.advancedOptions.cookiesBrowser !== 'none') {
    args.push('--cookies-from-browser', payload.advancedOptions.cookiesBrowser);
  }

  if (payload.advancedOptions.timeRange?.enabled) {
    const section = buildDownloadSection(
      payload.advancedOptions.timeRange.start,
      payload.advancedOptions.timeRange.end
    );
    if (section) {
      args.push('--download-sections', section);
    }
  }

  if (payload.advancedOptions.playlist === 'single') args.push('--no-playlist');
  if (payload.advancedOptions.playlist === 'all') args.push('--yes-playlist');

  if (payload.options.type === 'audio') {
    event.reply('download-progress', `🎵 音声形式: ${payload.options.audioFormat.toUpperCase()}`);

    args.push(
      '-x',
      '--audio-format',
      payload.options.audioFormat
    );

    // WAV uses bit depth instead of bitrate
    if (payload.options.audioFormat === 'wav') {
      event.reply('download-progress', `📊 ビット深度: ${payload.options.audioBitDepth || '16'}bit`);
      // WAV doesn't support --audio-quality, use postprocessor args for bit depth
      const bitDepth = payload.options.audioBitDepth || '16';
      args.push('--postprocessor-args', `ffmpeg:-acodec pcm_s${bitDepth}le`);
    } else {
      event.reply('download-progress', `📊 ビットレート: ${payload.options.audioBitrate}`);
      args.push('--audio-quality', payload.options.audioBitrate);
    }
  } else {
    event.reply('download-progress', `🎬 動画形式: ${payload.options.videoContainer.toUpperCase()}`);
    event.reply('download-progress', `📐 解像度: ${payload.options.videoResolution}`);

    if (payload.options.videoResolution !== 'best') {
      const height = payload.options.videoResolution.replace('p', '');
      args.push('-f', `bestvideo[height<=${height}]+bestaudio/best`);
    } else {
      args.push('-f', 'bestvideo+bestaudio/best');
    }
    args.push('--merge-output-format', payload.options.videoContainer);

    // Video conversion options
    if (payload.videoConversion?.enabled) {
      event.reply('download-progress', `🔄 変換オプション: 動画コーデック=${payload.videoConversion.videoCodec}, 音声コーデック=${payload.videoConversion.audioCodec}`);

      const postArgs: string[] = [];

      if (payload.videoConversion.videoCodec !== 'copy') {
        const codecMap: Record<string, string> = {
          'h264': 'libx264',
          'h265': 'libx265',
          'vp9': 'libvpx-vp9',
          'av1': 'libaom-av1'
        };
        postArgs.push(`-c:v ${codecMap[payload.videoConversion.videoCodec]}`);
        if (payload.videoConversion.videoBitrate) {
          postArgs.push(`-b:v ${payload.videoConversion.videoBitrate}`);
        }
      }

      if (payload.videoConversion.audioCodec !== 'copy') {
        const audioCodecMap: Record<string, string> = {
          'aac': 'aac',
          'mp3': 'libmp3lame',
          'opus': 'libopus'
        };
        postArgs.push(`-c:a ${audioCodecMap[payload.videoConversion.audioCodec]}`);
        if (payload.videoConversion.audioBitrate) {
          postArgs.push(`-b:a ${payload.videoConversion.audioBitrate}`);
        }
      }

      if (postArgs.length > 0) {
        args.push('--recode-video', payload.options.videoContainer);
        args.push('--postprocessor-args', `ffmpeg:${postArgs.join(' ')}`);
      }
    }
  }

  if (payload.args?.length) {
    args.push(...payload.args);
  }

  event.reply('download-progress', '⏳ ダウンロードを開始します...');

  let downloadedTitle = '';
  let downloadedFilepath = '';

  const sendCompletion = (result: DownloadResult) => {
    event.reply('download-complete', result);
    showDownloadNotification(payload.notificationsEnabled, result);
  };

  isDownloadCancelled = false;
  activeDownloadProcess = spawn(ytDlpInvocation.command, args, {
    windowsHide: true,
    env: buildYtDlpEnv(),
    detached: !isWindows
  });

  const forwardOutput = (chunk: string, onLine: (line: string) => void, bufferRef: { current: string }) => {
    bufferRef.current += chunk.replace(/\r/g, '\n');
    const lines = bufferRef.current.split('\n');
    bufferRef.current = lines.pop() ?? '';

    lines
      .map((line) => line.trim())
      .filter(Boolean)
      .forEach(onLine);
  };

  const stdoutBuffer = { current: '' };
  const stderrBuffer = { current: '' };

  if (activeDownloadProcess.stdout) {
    activeDownloadProcess.stdout.setEncoding('utf8');
    activeDownloadProcess.stdout.on('data', (data: string) => {
      forwardOutput(String(data), (line) => {
        if (line.startsWith(titleMarker)) {
          downloadedTitle = line.slice(titleMarker.length);
          return;
        }

        if (line.startsWith(pathMarker)) {
          downloadedFilepath = line.slice(pathMarker.length);
          return;
        }

        event.reply('download-progress', line);
      }, stdoutBuffer);
    });

    activeDownloadProcess.stdout.on('end', () => {
      const lastLine = stdoutBuffer.current.trim();
      if (lastLine) {
        event.reply('download-progress', lastLine);
      }
    });
  }

  if (activeDownloadProcess.stderr) {
    activeDownloadProcess.stderr.setEncoding('utf8');
    activeDownloadProcess.stderr.on('data', (data: string) => {
      forwardOutput(String(data), (line) => {
        event.reply('download-progress', line);
      }, stderrBuffer);
    });

    activeDownloadProcess.stderr.on('end', () => {
      const lastLine = stderrBuffer.current.trim();
      if (lastLine) {
        event.reply('download-progress', lastLine);
      }
    });
  }

  activeDownloadProcess.on('error', (error) => {
    event.reply('download-progress', `❌ エラー: ${error.message}`);
    sendCompletion({
      status: 'error',
      success: false,
      message: 'ダウンロード開始に失敗しました。'
    });
  });

  activeDownloadProcess.on('close', async (code) => {
    activeDownloadProcess = null;

    if (isDownloadCancelled) {
      if (downloadedFilepath && fs.existsSync(downloadedFilepath)) {
        await fs.promises.unlink(downloadedFilepath).catch(() => undefined);
      }
      event.reply('download-progress', '🚫 ダウンロードをキャンセルしました。');
      sendCompletion({
        status: 'cancelled',
        success: false,
        message: 'ダウンロードをキャンセルしました。',
        title: downloadedTitle,
        filename: downloadedFilepath
      });
      return;
    }

    let fileSize = 0;
    if (downloadedFilepath && fs.existsSync(downloadedFilepath)) {
      try {
        const stats = fs.statSync(downloadedFilepath);
        fileSize = stats.size;
      } catch (e) {
        // Ignore file stat errors
      }
    }

    if (code === 0) {
      event.reply('download-progress', '✅ ダウンロードが完了しました！');
      sendCompletion({
        status: 'complete',
        success: true,
        message: 'ダウンロードが完了しました。',
        title: downloadedTitle,
        filename: downloadedFilepath,
        fileSize
      });
    } else {
      event.reply('download-progress', `❌ エラーが発生しました (コード: ${code})`);
      sendCompletion({
        status: 'error',
        success: false,
        message: `エラーが発生しました (コード: ${code})`,
        title: downloadedTitle,
        filename: downloadedFilepath,
        fileSize
      });
    }
  });
});

ipcMain.handle('check-app-update', async () => {
  try {
    const release = await fetchJson<{ tag_name?: string; html_url?: string }>(
      'https://api.github.com/repos/tomakura/yt-dlp-gui/releases/latest',
      FAST_PREVIEW_TIMEOUT_MS
    );
    if (!release || !release.tag_name) {
      throw new Error('Invalid release data');
    }

    const latestVersion = release.tag_name.replace(/^v/, '');
    const currentVersion = app.getVersion();

    // Simple string comparison for now, or use semver if needed
    // Assuming versions are like "0.0.1"
    const isUpdateAvailable = latestVersion !== currentVersion;

    return {
      available: isUpdateAvailable,
      currentVersion,
      latestVersion,
      url: release.html_url
    };
  } catch (e) {
    console.error('Failed to check for app updates', e);
    return {
      available: false,
      currentVersion: app.getVersion(),
      error: '更新の確認に失敗しました'
    };
  }
});

ipcMain.handle('open-external', async (_, url) => {
  await shell.openExternal(url);
});

const toResolutionLabel = (height: number): string => {
  if (height >= 2160) return '4K';
  if (height >= 1440) return '1440p';
  if (height >= 1080) return '1080p';
  if (height >= 720) return '720p';
  if (height >= 480) return '480p';
  if (height >= 360) return '360p';
  return `${height}p`;
};

ipcMain.handle('fetch-video-info', async (_, request: VideoInfoRequest): Promise<VideoInfoResult> => {
  try {
    const cacheKey = getPreviewCacheKey(request);
    const cached = getCachedPreview(cacheKey);
    if (cached) {
      return cached;
    }

    const inFlight = previewInFlight.get(cacheKey);
    if (inFlight) {
      return inFlight;
    }

    const previewPromise = (async () => {
      let fastError: PreviewError | null = null;

      try {
        const fastResult = await fetchFastPreview(request);
        if (hasUsableFastPreview(fastResult)) {
          setCachedPreview(cacheKey, fastResult);
          return fastResult;
        }
      } catch (error) {
        fastError = classifyThrownError(error, 'fast', 'Fast preview failed');
      }

      try {
        const ytDlpResult = await fetchVideoInfoWithYtDlp(request);
        setCachedPreview(cacheKey, ytDlpResult);
        return ytDlpResult;
      } catch (error) {
        const fallbackError = classifyThrownError(error, 'yt_dlp', 'yt-dlp preview failed');
        return {
          isPlaylist: false,
          error: fallbackError.code === 'unsupported' && fastError ? fastError : fallbackError
        };
      }
    })();

    previewInFlight.set(cacheKey, previewPromise);
    const result = await previewPromise;
    return result;
  } catch (error) {
    console.error('Failed to fetch video info', error);
    return {
      isPlaylist: false,
      error: classifyThrownError(error, 'fast', 'Failed to fetch video info')
    };
  } finally {
    try {
      previewInFlight.delete(getPreviewCacheKey(request));
    } catch {
      // Ignore invalid URL cleanup issues
    }
  }
});

ipcMain.handle('detect-hw-encoders', async (): Promise<HwEncoderResult> => {
  const ffmpegPath = resolveFfmpegPath();

  if (!ffmpegPath) {
    return { available: [] };
  }

  const available: HwEncoderResult['available'] = [];

  try {
    const { stdout } = await execAsync(`"${ffmpegPath}" -hide_banner -encoders`);

    if (stdout.includes('h264_nvenc') || stdout.includes('hevc_nvenc')) {
      available.push('nvenc');
    }
    if (stdout.includes('h264_qsv') || stdout.includes('hevc_qsv')) {
      available.push('qsv');
    }
    if (stdout.includes('h264_videotoolbox') || stdout.includes('hevc_videotoolbox')) {
      available.push('videotoolbox');
    }
    if (stdout.includes('h264_amf') || stdout.includes('hevc_amf')) {
      available.push('amf');
    }
  } catch (error) {
    console.error('Failed to detect hardware encoders', error);
  }

  return { available };
});
