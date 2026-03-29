# JDTorrent — CLAUDE.md

Desktop torrent client built with Electron + Vue 3 + TypeScript. Supports torrent management and movie discovery via YTS API.

## Commands

```bash
npm run dev          # Start dev server (Vite + Electron concurrently)
npm run build        # Production build (Vite + tsc + electron-builder)
npm run build:linux  # Linux build (AppImage + .deb)
npm run build:win    # Windows build (NSIS installer)
npm test             # Run unit tests (Vitest)
npm run lint         # ESLint (TypeScript + Vue)
```

> **WSL2:** Electron requires system libs. Install if missing:
> `sudo apt-get install -y libnspr4 libnss3 libatk1.0-0 libatk-bridge2.0-0 libcups2 libxcomposite1 libxdamage1 libxfixes3 libxrandr2 libgbm1 libxkbcommon0 libpango-1.0-0 libcairo2 libasound2t64`

## Architecture

Two processes separated by a strict IPC boundary:

```
Renderer (Vue 3)          IPC via window.electronAPI          Main (Electron/Node)
─────────────────     ←──────────────────────────────→     ────────────────────────
src/views/            electron/preload.ts (context bridge)  electron/main.ts
src/components/                                             electron/torrent.ts
src/services/                                               electron/settings.ts
```

- The renderer **never** imports Node modules — all system access goes through `window.electronAPI`
- `electron/preload.ts` defines the entire API surface exposed to the renderer

## Project Structure

```
electron/
  main.ts        # App lifecycle, window creation, auto-updater
  preload.ts     # Context bridge — defines window.electronAPI
  torrent.ts     # WebTorrent engine + all torrent IPC handlers + persistence
  settings.ts    # Settings CRUD, tracker defaults, folder picker IPC

src/
  views/
    TorrentsView.vue      # Main list — filters, play/pause, delete, piece map (polls 500ms)
    SettingsView.vue      # Download path, YTS URL, trackers, language, VPN port
    MoviesView.vue        # YTS movie browser with search + pagination
    MovieDetailsView.vue  # Movie details, torrent picker, direct download
  components/
    Sidebar.vue           # Navigation
    AddTorrentModal.vue   # Add via .torrent file or magnet link
    TorrentFilesModal.vue # Select which files to download before starting
  services/
    yts.ts          # YTS API client (listMovies, getMovieDetails)
  utils/
    torrent.ts      # formatSpeed, formatSize, statusClass helpers
  types/
    torrent.ts      # TorrentInfo, TorrentFile interfaces
    movie.ts        # Movie, MovieTorrent interfaces
    electron.d.ts   # window.electronAPI type definitions
  locales/
    en.ts           # English translations
    pt-BR.ts        # Brazilian Portuguese translations
```

## Key Patterns

**Pause = Destroy:** Pausing a torrent destroys it in WebTorrent memory but keeps metadata in `torrents.json`. Resume reconstructs it from the stored magnetURI + savePath.

**Persistence:** Stored in `app.getPath('appData')` as JSON files (`torrents.json`, `settings.json`). Tracks magnetURI, savePath, addedAt, progress, and selectedFiles.

**Polling:** `TorrentsView` polls `electronAPI.getTorrents()` every 500ms for live stats (speed, peers, progress, piece map). No event/subscription system.

**Selective Downloads:** Files are chosen via `TorrentFilesModal` before the torrent starts. Selected file indices are stored in metadata.

**Partial file progress:** `calculateProgress` in `torrent.ts` computes progress based only on selected files (`f.downloaded / f.length`), not the whole torrent. `meta.progress === 1` (set by the `done` event) always short-circuits to 1 to handle piece-boundary edge cases.

**Piece map:** `getPiecesMap` buckets piece states into 200 segments using `torrent.pieces` (null = complete) and `wire.requests` (actively downloading). Returns values 0/0.5/1 rendered as a CSS gradient in `TorrentsView` — gray/cyan/blue.

**Boundary piece fix:** On resume with selected files, unwanted files are deselected first, then wanted files are explicitly re-selected (`f.select()`). This ensures pieces shared at file boundaries stay in the download queue.

**VPN port:** `torrentPort` setting (default 0 = auto) is passed to the WebTorrent constructor at startup. Requires app restart to take effect.

**i18n:** Portuguese (pt-BR) is primary, English is fallback. Language toggled in Settings and persisted.

## TypeScript Configs

- `tsconfig.app.json` — renderer (strict mode, browser globals)
- `electron/tsconfig.json` — main process (ES2020, CommonJS modules)

## Build & Release

- Version tags (`vX.Y.Z`) trigger cross-platform builds via GitHub Actions
- Linux: AppImage + .deb; Windows: NSIS installer
- Auto-update uses `electron-updater` pointing to GitHub Releases
- `__APP_VERSION__` and `__COMMIT_HASH__` injected at build time by Vite
