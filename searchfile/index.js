/**
 * Host half of the File Search bundle.
 *
 * A small, dependency-free filename index over the local drives. The browser
 * half talks to this module through one same-origin HTTP route, so no Remote
 * schema or generated code is involved. The index is built lazily on the first
 * request, answers from its partial contents while the scan runs, and keeps a
 * cache under the user's local app-data directory for fast later sessions.
 */
import { constants as fsConstants, promises as fsp } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

export const inject = ['webServer'];

/** Same-origin route used by the Client half. */
const ROUTE = '/plugin-file-search/search';
const CACHE_VERSION = 3;
const QUERY_MAX_LENGTH = 200;
const DEFAULT_MAX_ENTRIES = 300_000;
const DEFAULT_REFRESH_MINUTES = 10;
const DEFAULT_MAX_RESULTS = 60;
const MAX_DEPTH = 36;
const YIELD_EVERY = 350;
const ROOT_PROBE_TIMEOUT_MS = 550;

/**
 * Directory names never descended into. These are either huge generated trees
 * or operating-system stores that would consume the whole entry budget before
 * reaching the person's documents.
 */
const DEFAULT_EXCLUDED_DIRECTORIES = [
  'node_modules',
  '.git',
  '.svn',
  '.hg',
  '__pycache__',
  '.venv',
  'venv',
  '.cache',
  '.dsh',
  '.npm',
  '.pnpm-store',
  '.yarn',
  '.gradle',
  '.next',
  '.nuxt',
  '.turbo',
  '_cacache',
  'npm-cache',
  '$recycle.bin',
  'system volume information',
  'appdata',
  'programdata',
  'program files',
  'program files (x86)',
  'windows',
  'winsxs',
  'recovery',
  'perflogs',
  'msocache',
];

/** @param {string} value */
function normalizeDirName(value) {
  return value.toLowerCase();
}

/** @param {string} root */
function isWindows() {
  return process.platform === 'win32';
}

/** @param {string} value */
function expandHome(value) {
  const home = os.homedir();
  if (value === '~') return home;
  if (value.startsWith('~/') || value.startsWith('~\\')) {
    return path.join(home, value.slice(2));
  }
  return value;
}

/** @param {string} value */
function normalizePathKey(value) {
  return isWindows() ? value.toLowerCase() : value;
}

/** @param {string} value */
function trimPath(value) {
  const trimmed = value.trim();
  if (!trimmed) return '';
  const normalized = path.normalize(trimmed);
  if (/^[A-Za-z]:[\\/]$/.test(normalized)) return normalized;
  return normalized.length > 1 ? normalized.replace(/[\\/]+$/, '') : normalized;
}

/**
 * Read the optional plugin-row config. The bundle deliberately declares no
 * Config schema so it stays dependency-free; these values are defensive.
 * @param {unknown} config
 */
function readConfig(config) {
  const source = config && typeof config === 'object' ? config : {};
  const rawRoots = Array.isArray(source.roots) ? source.roots : [];
  const roots = rawRoots
    .filter((value) => typeof value === 'string' && value.trim().length > 0)
    .map((value) => trimPath(expandHome(value)))
    .filter(Boolean);

  const rawMax = Number(source.maxEntries);
  const maxEntries = Number.isSafeInteger(rawMax) && rawMax >= 1_000
    ? Math.min(rawMax, 1_000_000)
    : DEFAULT_MAX_ENTRIES;

  const rawRefresh = Number(source.refreshMinutes);
  const refreshMinutes = Number.isFinite(rawRefresh) && rawRefresh >= 0
    ? Math.min(rawRefresh, 10_080)
    : DEFAULT_REFRESH_MINUTES;

  const extraExcluded = Array.isArray(source.exclude)
    ? source.exclude
      .filter((value) => typeof value === 'string' && value.trim().length > 0)
      .map((value) => normalizeDirName(value.trim().replace(/[\\/]+$/, '')))
    : [];

  return {
    roots,
    maxEntries,
    refreshMinutes,
    warmOnStart: source.warmOnStart !== false,
    excludedDirectories: new Set([...DEFAULT_EXCLUDED_DIRECTORIES, ...extraExcluded]),
  };
}

/** @returns {Promise<string[]>} */
async function discoverRoots(config) {
  if (config.roots.length > 0) {
    const readable = await Promise.all(config.roots.map(async (candidate) => {
      return await isReadable(candidate) ? candidate : '';
    }));
    const found = readable.filter(Boolean);
    return dedupeRoots(found.length > 0 ? found : config.roots);
  }

  const home = trimPath(os.homedir());
  const candidates = [];
  if (home) candidates.push(home);
  if (isWindows()) {
    for (let code = 65; code <= 90; code += 1) {
      candidates.push(`${String.fromCharCode(code)}:\\`);
    }
  } else {
    candidates.push('/');
  }

  const readable = await Promise.all(candidates.map(async (candidate) => {
    return await isReadable(candidate) ? candidate : '';
  }));
  const roots = readable.filter(Boolean);
  if (roots.length === 0 && home) roots.push(home);
  return dedupeRoots(roots);
}

/** @param {string} root */
async function isReadable(root) {
  let timer;
  try {
    await Promise.race([
      fsp.access(root, fsConstants.R_OK),
      new Promise((_, reject) => {
        timer = setTimeout(() => reject(new Error('timeout')), ROOT_PROBE_TIMEOUT_MS);
      }),
    ]);
    return true;
  } catch {
    return false;
  } finally {
    if (timer) clearTimeout(timer);
  }
}

/** @param {string[]} roots */
function dedupeRoots(roots) {
  const seen = new Set();
  const result = [];
  for (const root of roots) {
    const key = normalizePathKey(trimPath(root));
    if (!key || seen.has(key)) continue;
    seen.add(key);
    result.push(trimPath(root));
  }
  return result;
}

/** @param {string} filePath */
function toEntry(filePath) {
  const name = path.basename(filePath);
  return {
    path: filePath,
    name,
    lowerPath: filePath.toLowerCase(),
    lowerName: name.toLowerCase(),
  };
}

/** @param {string} value */
function formatError(value) {
  if (value instanceof Error) return value.message;
  return String(value);
}

/**
 * Cached filename index. Only paths are persisted; lowercase forms used by the
 * matcher are regenerated on load.
 */
export class FileSearchIndex {
  /** @param {unknown} config */
  constructor(config) {
    this.config = readConfig(config);
    /** @type {Array<{path: string, name: string, lowerPath: string, lowerName: string}>} */
    this.entries = [];
    /** @type {Array<{path: string, name: string, lowerPath: string, lowerName: string}>} */
    this.scanEntries = [];
    /** @type {Set<string> | null} */
    this.scanPaths = null;
    /** @type {string[]} */
    this.roots = [];
    this.rootsKey = '';
    this.currentRoot = '';
    this.starting = false;
    this.scanning = false;
    this.complete = false;
    this.truncated = false;
    this.failedDirectories = 0;
    this.lastError = '';
    this.builtAt = 0;
    this.cachedComplete = false;
    this.cachedRootsKey = '';
    this.ensureStarted = false;
    this.disposed = false;
  }

  /** Start lazy initialization exactly once. */
  ensure() {
    if (this.ensureStarted || this.disposed) return;
    this.ensureStarted = true;
    this.starting = true;
    void this.boot();
  }

  /**
   * Warm the index from an existing cache after activation, without starting a
   * full first-run scan the person did not ask for. A first search still calls
   * ensure() and builds the index normally.
   */
  async warm() {
    if (this.ensureStarted || this.disposed) return;
    try {
      await fsp.access(cacheFilePath());
    } catch {
      return;
    }
    if (this.ensureStarted || this.disposed) return;
    this.ensure();
  }

  async boot() {
    try {
      await this.loadCache();
      this.roots = await discoverRoots(this.config);
      this.rootsKey = this.roots.map((root) => normalizePathKey(root)).join('|');
      if (this.disposed) return;

      const ageMs = this.builtAt > 0 ? Date.now() - this.builtAt : Number.POSITIVE_INFINITY;
      const fresh = this.cachedComplete
        && this.cachedRootsKey === this.rootsKey
        && ageMs < this.config.refreshMinutes * 60_000;

      if (fresh) {
        this.complete = true;
        this.starting = false;
        return;
      }

      this.starting = false;
      await this.scan();
    } catch (error) {
      this.starting = false;
      this.scanning = false;
      this.complete = false;
      this.lastError = formatError(error);
    }
  }

  async scan() {
    if (this.disposed) return;
    if (this.roots.length === 0) {
      this.lastError = 'No readable root directory was found.';
      this.complete = false;
      return;
    }

    this.starting = false;
    this.scanning = true;
    this.complete = false;
    this.truncated = false;
    this.failedDirectories = 0;
    this.lastError = '';
    this.scanEntries = [];
    this.scanPaths = new Set();

    try {
      for (const root of this.roots) {
        if (this.disposed) return;
        if (this.scanEntries.length >= this.config.maxEntries) {
          this.truncated = true;
          break;
        }
        this.currentRoot = root;
        await this.scanRoot(root);
      }

      if (this.disposed) return;

      this.scanning = false;
      this.currentRoot = '';
      this.entries = this.scanEntries;
      this.scanEntries = [];
      this.scanPaths = null;
      this.builtAt = Date.now();
      this.complete = true;
      if (this.failedDirectories > 0 && this.entries.length === 0) {
        this.lastError = 'No file could be read. Check disk permissions.';
      }
      await this.saveCache();
    } catch (error) {
      if (this.disposed) return;
      this.scanning = false;
      this.currentRoot = '';
      this.lastError = formatError(error);
      this.complete = false;
    }
  }

  /** @param {string} root */
  async scanRoot(root) {
    /** @type {Array<{dir: string, depth: number}>} */
    const queue = [{ dir: root, depth: 0 }];
    let cursor = 0;
    let processed = 0;

    while (cursor < queue.length) {
      if (this.disposed) return;
      if (this.scanEntries.length >= this.config.maxEntries) {
        this.truncated = true;
        return;
      }

      const item = queue[cursor];
      cursor += 1;
      let dirHandle;
      try {
        dirHandle = await fsp.opendir(item.dir);
      } catch {
        this.failedDirectories += 1;
        continue;
      }

      try {
        for await (const dirEntry of dirHandle) {
          if (this.disposed) return;
          if (this.scanEntries.length >= this.config.maxEntries) {
            this.truncated = true;
            return;
          }

          if (dirEntry.isSymbolicLink()) continue;
          const fullPath = path.join(item.dir, dirEntry.name);

          if (dirEntry.isDirectory()) {
            if (item.depth >= MAX_DEPTH) continue;
            if (this.config.excludedDirectories.has(normalizeDirName(dirEntry.name))) continue;
            queue.push({ dir: fullPath, depth: item.depth + 1 });
          } else if (dirEntry.isFile()) {
            this.addFile(fullPath, dirEntry.name);
          } else {
            try {
              const stat = await fsp.stat(fullPath);
              if (stat.isDirectory()) {
                if (item.depth < MAX_DEPTH && !this.config.excludedDirectories.has(normalizeDirName(dirEntry.name))) {
                  queue.push({ dir: fullPath, depth: item.depth + 1 });
                }
              } else if (stat.isFile()) {
                this.addFile(fullPath, dirEntry.name);
              }
            } catch {
              this.failedDirectories += 1;
            }
          }

          processed += 1;
          if (processed % YIELD_EVERY === 0) await this.yieldToEventLoop();
        }
      } catch {
        this.failedDirectories += 1;
      } finally {
        try {
          await dirHandle.close();
        } catch {
          // The async iterator normally closes it already.
        }
      }
    }
  }

  /** @param {string} fullPath @param {string} name */
  addFile(fullPath, name) {
    if (!this.scanPaths || this.scanEntries.length >= this.config.maxEntries) return;
    const lowerPath = fullPath.toLowerCase();
    if (this.scanPaths.has(lowerPath)) return;
    this.scanPaths.add(lowerPath);
    this.scanEntries.push({
      path: fullPath,
      name,
      lowerPath,
      lowerName: name.toLowerCase(),
    });
  }

  yieldToEventLoop() {
    return new Promise((resolve) => setImmediate(resolve));
  }

  /**
   * Return ranked paths. An empty query returns no rows but still reports the
   * current index state so the panel can show progress before the first key.
   * @param {string} rawQuery
   * @param {number} rawLimit
   */
  search(rawQuery, rawLimit = DEFAULT_MAX_RESULTS) {
    this.ensure();
    const query = String(rawQuery ?? '').slice(0, QUERY_MAX_LENGTH).trim();
    const normalized = query.toLowerCase();
    const limit = Number.isFinite(Number(rawLimit))
      ? Math.max(1, Math.min(100, Math.trunc(Number(rawLimit))))
      : DEFAULT_MAX_RESULTS;

    const source = this.entries.length > 0 ? this.entries : this.scanEntries;
    /** @type {Array<{path: string, name: string, dir: string}>} */
    const results = [];
    let total = 0;
    let elapsedMs = 0;

    if (normalized) {
      const started = performance.now();
      const tokens = normalized.split(/\s+/).filter(Boolean);
      /** @type {Array<{entry: {path: string, name: string, lowerPath: string, lowerName: string}, score: number}>} */
      const matches = [];

      for (const entry of source) {
        let rank = -1;
        if (entry.lowerName === normalized) rank = 0;
        else if (entry.lowerName.startsWith(normalized)) rank = 1;
        else if (entry.lowerName.includes(normalized)) rank = 2;
        else if (entry.lowerPath.includes(normalized)) rank = 3;

        if (rank < 0) {
          if (tokens.length < 2) continue;
          let everyToken = true;
          for (const token of tokens) {
            if (!entry.lowerName.includes(token) && !entry.lowerPath.includes(token)) {
              everyToken = false;
              break;
            }
          }
          if (!everyToken) continue;
          rank = 4;
        }

        matches.push({
          entry,
          score: rank * 10_000_000 + entry.name.length * 100 + entry.path.length,
        });
      }

      matches.sort((left, right) => {
        if (left.score !== right.score) return left.score - right.score;
        if (left.entry.path < right.entry.path) return -1;
        if (left.entry.path > right.entry.path) return 1;
        return 0;
      });

      for (let index = 0; index < matches.length && results.length < limit; index += 1) {
        const entry = matches[index].entry;
        results.push({
          path: entry.path,
          name: entry.name,
          dir: path.dirname(entry.path),
        });
      }
      total = matches.length;
      elapsedMs = Math.max(0, Math.round(performance.now() - started));
    }

    const indexed = this.entries.length > 0 ? this.entries.length : this.scanEntries.length;
    return {
      query,
      results,
      total,
      indexed,
      busy: this.starting || this.scanning,
      starting: this.starting,
      scanning: this.scanning,
      complete: this.complete && !this.starting && !this.scanning,
      truncated: this.truncated,
      currentRoot: this.currentRoot,
      roots: this.roots.slice(),
      failedDirectories: this.failedDirectories,
      error: this.lastError,
      elapsedMs,
    };
  }

  async loadCache() {
    const file = cacheFilePath();
    try {
      const text = await fsp.readFile(file, 'utf8');
      const parsed = JSON.parse(text);
      if (!parsed || parsed.version !== CACHE_VERSION || !Array.isArray(parsed.paths)) return;

      const seen = new Set();
      const entries = [];
      for (const rawPath of parsed.paths) {
        if (typeof rawPath !== 'string' || rawPath.length === 0) continue;
        const key = rawPath.toLowerCase();
        if (seen.has(key)) continue;
        if (entries.length >= this.config.maxEntries) break;
        seen.add(key);
        entries.push(toEntry(rawPath));
      }

      this.entries = entries;
      this.builtAt = Number.isFinite(parsed.builtAt) ? parsed.builtAt : 0;
      this.cachedComplete = parsed.complete === true;
      this.cachedRootsKey = typeof parsed.rootsKey === 'string' ? parsed.rootsKey : '';
      this.truncated = parsed.truncated === true;
    } catch {
      // Missing or unreadable cache is the normal first-run path.
    }
  }

  async saveCache() {
    if (this.disposed) return;
    const target = cacheFilePath();
    const temporary = `${target}.${process.pid}.tmp`;
    const payload = JSON.stringify({
      version: CACHE_VERSION,
      builtAt: this.builtAt,
      rootsKey: this.rootsKey,
      complete: this.complete,
      truncated: this.truncated,
      paths: this.entries.map((entry) => entry.path),
    });

    try {
      await fsp.mkdir(path.dirname(target), { recursive: true });
      await fsp.writeFile(temporary, payload, 'utf8');
      try {
        await fsp.rename(temporary, target);
      } catch {
        await fsp.rm(target, { force: true });
        await fsp.rename(temporary, target);
      }
    } catch {
      try {
        await fsp.rm(temporary, { force: true });
      } catch {
        // Cache writing is best effort.
      }
    }
  }

  dispose() {
    this.disposed = true;
    this.scanEntries = [];
    this.scanPaths = null;
  }
}

function cacheFilePath() {
  const override = process.env.DSH_FILE_SEARCH_CACHE_DIR;
  if (override && override.trim()) {
    return path.join(override.trim(), `index-v${CACHE_VERSION}.json`);
  }
  const base = process.env.LOCALAPPDATA
    || process.env.XDG_CACHE_HOME
    || path.join(os.homedir(), '.cache');
  return path.join(base, 'dsh-file-search', `index-v${CACHE_VERSION}.json`);
}

/** @param {import('node:http').ServerResponse} res @param {number} status @param {unknown} payload */
function sendJson(res, status, payload) {
  const body = JSON.stringify(payload);
  res.writeHead(status, {
    'Content-Type': 'application/json; charset=utf-8',
    'Content-Length': Buffer.byteLength(body),
    'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff',
  });
  res.end(body);
}

/** @param {FileSearchIndex} index @param {import('node:http').IncomingMessage} req @param {import('node:http').ServerResponse} res */
async function handleRequest(index, req, res) {
  if (req.method !== 'GET') {
    sendJson(res, 405, { ok: false, error: 'Method not allowed.' });
    return;
  }

  try {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    const query = url.searchParams.get('q') ?? '';
    const limit = url.searchParams.get('limit') ?? String(DEFAULT_MAX_RESULTS);
    const payload = index.search(query, Number(limit));
    sendJson(res, 200, { ok: true, ...payload });
  } catch (error) {
    sendJson(res, 500, { ok: false, error: formatError(error) });
  }
}

/**
 * Register the HTTP route under the Web server's lifetime. The UI exists only
 * in the Web composition, so `webServer` is a hard dependency.
 * @param {{effect: Function, webServer: {register: Function}}} ctx
 * @param {unknown} config
 */
export function apply(ctx, config) {
  ctx.effect(() => {
    const index = new FileSearchIndex(config);
    const disposeRoute = ctx.webServer.register({
      kind: 'exact',
      path: ROUTE,
      handler: (req, res) => handleRequest(index, req, res),
    });
    const warmTimer = index.config.warmOnStart
      ? setTimeout(() => void index.warm(), 1200)
      : undefined;
    return () => {
      if (warmTimer) clearTimeout(warmTimer);
      disposeRoute();
      index.dispose();
    };
  });
}
