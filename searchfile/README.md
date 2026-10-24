<p align="center">
  <img src="icon.svg" width="88" height="88" alt="DSH File Search icon">
</p>

<h1 align="center">DSH File Search</h1>

<p align="center">
  A compact, draggable local file search window for <strong>DeepSeek Harness</strong>.
  <br>
  Search file names, read absolute paths, and copy them in one click.
</p>

<p align="center">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue.svg"></a>
  <img alt="Dependencies: 0" src="https://img.shields.io/badge/dependencies-0-brightgreen">
  <img alt="Node.js >= 20" src="https://img.shields.io/badge/Node.js-%3E%3D20-339933">
</p>

<p align="center">
  <strong>English</strong> | <a href="README.zh-CN.md">简体中文</a>
</p>

DSH File Search adds a floating search button to the Harness Web UI. Click it, type part of a file name, and get ranked absolute paths from a local filename index. The result row is clickable, so the path lands on the clipboard immediately.

The plugin is intentionally small: two JavaScript files, no runtime dependencies, no build step, and no network calls.

## Features

- **Compact floating window** rendered in the Harness `shell.overlay` slot.
- **Draggable panel** by its title bar, clamped to the viewport.
- **Draggable launcher** while the panel is closed; a click still opens the panel.
- **Instant filename search** over a lazily built local index.
- **Absolute-path results** with one-click copy and a visible copied state.
- **Keyboard-first flow**: `Ctrl+Shift+F` opens, `Up`/`Down` selects, `Enter` copies, `Escape` closes.
- **Bilingual UI** (English / 简体中文) and light/dark theme support through Harness tokens.
- **Zero runtime dependencies**, zero build output, no telemetry, no external HTTP requests.
- **Configurable scope** through the bundle row config: roots, entry budget, refresh interval, warm start, and extra exclusions.

## Requirements

- A DSH installation with the Web UI and the `shell.overlay` slot.
- Node.js 20 or newer for the Host half.
- Windows 10/11 is the primary target. On other platforms, set `roots` explicitly in the plugin config.
- No separate build tools or package dependencies.

Tested against DSH `0.2.1-rc.3` on Windows.

## Install

### 1. Clone the repository

```bash
git clone https://github.com/<your-name>/searchfile.git
```

Replace `<your-name>` with the GitHub account that owns the repository.

### 2. Install the directory as a DSH bundle

Use DSH's local-path bundle installation. From an agent session with the
`plugin_manager` tool enabled, the operation is `install_bundle` with the
absolute directory as `target`:

```text
plugin_manager
  action: install_bundle
  target: <absolute-path-to-this-folder>
```

The package is linked from the checkout rather than copied, so keep the folder
in place after installation.

> If an earlier local copy is already installed under a different package name,
> remove that bundle first. Both copies use the same `file-search` row id and
> the same HTTP route, so they cannot coexist.

### 3. Enable the row if necessary

Open **Settings → Plugins** and enable `include:file-search` if it is disabled.

### 4. Refresh the Web UI

Refresh the page once after installation. A **Search files** button appears in
the bottom-right corner. Click it, or press `Ctrl+Shift+F`.

> The repository is a DSH bundle, not a published npm package. `private: true`
> in `package.json` is intentional.

## Usage

1. Open the launcher or press `Ctrl+Shift+F`.
2. Type a file name, part of a name, or a fragment of a path.
3. Results show the file name and its absolute path, ranked by match quality.
4. Click a result, or select it with `Up`/`Down` and press `Enter`, to copy the
   full path.
5. Drag the title bar to move the panel. Drag the closed-launcher button to
   reposition it.
6. Press `Escape` to close the panel.

The footer shows either the total number of matches or `shown / total` when the
60-row display limit is reached.

## Configuration

The plugin reads optional row config even though it does not declare a Config
schema, so there is no settings form. Add an override to the profile patch:

```yaml
- id: file-search
  config:
    roots:
      - 'C:\\'
      - 'D:\\'
    maxEntries: 300000
    refreshMinutes: 10
    warmOnStart: true
    exclude:
      - 'MyHugeFolder'
```

An override replaces the complete `config` object, so repeat every field you
want to keep.

| Field | Default | Meaning |
|---|---|---|
| `roots` | Home directory + every readable drive letter | Absolute directories to index. `~` is expanded. |
| `maxEntries` | `300000` | Maximum indexed files. Clamped to `1000`–`1000000`. |
| `refreshMinutes` | `10` | Cache age before a background rescan. `0` refreshes on each activation; maximum `10080` (7 days). |
| `warmOnStart` | `true` | Load an existing cache shortly after activation. A first run with no cache still waits for the first search. |
| `exclude` | `[]` | Extra directory basenames to skip, case-insensitive. |

Built-in exclusions cover system, cache, and dependency trees, including
`Windows`, `WinSxS`, `Program Files`, `ProgramData`, `AppData`, `$Recycle.Bin`,
`node_modules`, `.git`, `.cache`, `.npm`, `.pnpm-store`, `.venv`, and
`__pycache__`.

## How it works

```text
Browser (client.js)
  GET /plugin-file-search/search?q=report&limit=60
        |
        v
Host (index.js)
  in-memory filename index  <-->  local cache
        |
        v
  JSON: ranked paths, total matches, index status
```

- **Client**: registered through `window.__ModuleLoader__.load`, injected into
  `shell.overlay`. It renders plain React elements with inlined CSS and reads
  theme tokens such as `--dsw-alias-bg-overlay`.
- **Host**: a dependency-free index built with `fs.promises.opendir`, one
  same-origin `GET` route, and an atomic cache write.
- **Search**: exact name, name prefix, name substring, path substring, then
  multi-token matches. Ties are broken by name length and path length.
- **Cache**: `index-v3.json`, stored under the user cache directory. The cache
  contains absolute paths only, never file contents.
- **Refresh**: a warm cache is loaded after activation. If the cache is older
  than `refreshMinutes`, the index rescans in the background while old results
  remain searchable.

## Privacy and security

- No telemetry, analytics, or external network requests.
- No file contents are read. Only directory entries and metadata are used.
- The only HTTP surface is a same-origin `GET /plugin-file-search/search` route.
  Other methods receive `405`.
- The route replies to requests that already reached the DSH Web server. Do not
  expose the DSH port to untrusted networks while the plugin is enabled.
- The local cache contains absolute paths. Delete it if you need to remove that
  record; the next search rebuilds it.

See [SECURITY.md](SECURITY.md) for the full trust model and reporting process.

## Performance and limits

Measured on a Windows desktop with roughly 300,000 indexed files:

| Operation | Typical time |
|---|---|
| First index build | 20–30 seconds |
| Warm cache load | 2–3 seconds |
| Search query | 30–60 milliseconds |

The UI remains usable while the first index is being built: results appear as
the scan progresses and the status line shows the current root.

Known limits:

- **Filename search, not content search.**
- **No live filesystem watch.** New files appear after the next refresh/rebuild.
- **Entry cap and exclusions.** The default index is deliberately bounded so a
  full disk scan cannot stall the UI.
- **60 displayed rows.** The footer still reports the total match count.
- **Symbolic links and junctions are skipped** to avoid cycles.
- **Panel and launcher positions reset on page reload.**
- The default drive discovery targets Windows. Other platforms should provide
  `roots`.

## Development

```bash
npm run check
```

The check runs syntax validation plus `scripts/check.mjs`, which verifies the
manifest, package/Client/patch naming invariant, exports, locale metadata, icon,
and Host route.

There is no build step and no `npm install` requirement.

### Editing rules

- Keep the Host half dependency-free and limited to Node built-ins.
- Keep the Client half limited to `require('react')`. Do not import Harness
  Client packages such as `@deepseek-ai/dsh-client-ui-primitives`.
- Keep the package name, Client module id, and patch row name in sync.
- Test both a cold index build and a warm-cache start.
- Use a disposable DSH profile for destructive tests.

See [CONTRIBUTING.md](CONTRIBUTING.md) for the pull-request checklist.

## Repository layout

| Path | Purpose |
|---|---|
| `index.js` | Host half: index, cache, HTTP route, optional config. |
| `client.js` | Browser half: launcher, draggable panel, search and copy UI. |
| `cordis.patch.yml` | Inserts the `file-search` row into the Harness composition. |
| `package.json` | Bundle and Client manifest. |
| `locale/en.json`, `locale/zh.json` | Plugin Manager title and description. |
| `icon.svg` | Original plugin artwork. |
| `scripts/check.mjs` | Repository consistency checks. |
| `.github/workflows/check.yml` | CI syntax and manifest check. |
| `CHANGELOG.md` | Release history. |

## Uninstall

Disable or remove `include:file-search` in **Settings → Plugins**. To remove the
local index cache as well:

- Windows: delete `%LOCALAPPDATA%\dsh-file-search\index-v3.json`
- Other platforms: delete `$XDG_CACHE_HOME/dsh-file-search/` or
  `~/.cache/dsh-file-search/`

## License

MIT. See [LICENSE](LICENSE).

Built for DeepSeek Harness. Not affiliated with or endorsed by DeepSeek.
