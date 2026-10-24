# Changelog

All notable changes to this project are documented in this file.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project uses [Semantic Versioning](https://semver.org/).

## [1.1.0] - 2026-10-24

### Added

- Draggable search panel: drag the title bar to move the window anywhere in the viewport.
- Draggable launcher: drag the floating button while the panel is closed; a click still opens the panel.
- Position clamping so neither surface can be dragged out of the visible viewport.
- English and Chinese UI dictionaries.
- Original SVG icon and plugin metadata.
- Open-source documentation, CI syntax checks, and package consistency checks.

### Changed

- Renamed the package from the local-only scope to `dsh-file-search` for public distribution.
- Search panel and launcher positions are kept for the current page session.

## [1.0.0] - 2026-10-24

### Added

- Compact floating file-search window in `shell.overlay`.
- Lazy local filename index with a persistent cache.
- Absolute-path results and one-click clipboard copy.
- Keyboard navigation (`Up`/`Down`/`Enter`/`Escape`) and `Ctrl+Shift+F` shortcut.
- Configurable roots, entry budget, refresh interval, warm start, and extra exclusions.
