# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

A full-stack Spotify playlist/track downloader. Users paste a Spotify URL; the app fetches metadata via the Spotify API, finds matching YouTube videos via `yt-dlp`, downloads them as MP3s, and serves a ZIP archive.

**Stack:** Go backend (Echo v4) · Next.js 15 frontend · Nginx reverse proxy · Docker Compose

## Keeping this file current

**Whenever you add a feature, create a new file, change a command, or modify the architecture, update the relevant section of this file.** This is the primary reference for future Claude instances.

---

## Environment Setup

Copy `.env.example` to `.env` and fill in your Spotify credentials. All other values are correct for local dev:

```
SPOTIFY_CLIENT_ID=""
SPOTIFY_CLIENT_SECRET=""
API_URL="http://localhost:1323"
NEXT_PUBLIC_WS_URL="ws://localhost:1323"
```

**`API_URL`** — used by Next.js server-side to proxy `/api/*` requests to the backend.

**`NEXT_PUBLIC_WS_URL`** — must be set for local dev. Next.js rewrites only proxy HTTP, not WebSocket upgrades, so the browser needs a direct `ws://` URL to the backend. In production (Docker) this var is intentionally absent — the app falls back to the page's own host and Nginx handles the WebSocket upgrade.

**`cookies.txt`** — required by yt-dlp for MP3 downloads (`DownloadToFile`). Place at the repo root. Not needed for raw audio streaming (`GetAudioStream`). Add `cookies.txt` to `.gitignore`.

---

## Commands

### Prerequisites (install once)

```bash
go install github.com/air-verse/air@latest   # Go live reload
go install github.com/gzuidhof/tygo@latest  # TypeScript type generation
cd frontend && npm install
```

### Local development (two terminals)

```bash
# Terminal 1 — Go backend on :1323 (with live reload)
make backend-dev     # uses air; or: make backend (no reload)

# Terminal 2 — Next.js frontend on :3000
make frontend        # or: cd frontend && npm run dev
```

The backend loads `../.env` relative to `backend/`, so it picks up the root `.env` automatically.

### Type generation

```bash
make gen   # tygo generate → rewrites frontend/src/types/api.ts
```

Run this whenever you change `backend/models/types.go`. **Never edit `frontend/src/types/api.ts` manually.**

### Frontend checks

```bash
cd frontend
npm run typecheck    # tsc --noEmit
npm run check        # lint + typecheck
npm run format:write
```

### Production (Docker)

```bash
make docker-up    # docker compose up --build → http://localhost:80
make docker-down
```

Docker overrides `API_URL` to the internal `http://backend:1323` via build args and runtime env. `NEXT_PUBLIC_WS_URL` is never set in Docker — production uses the page origin and Nginx handles WebSocket proxying.

---

## Architecture

### Request Flow

```
Browser → Nginx (:80)
  /api/*  → Go backend (:1323)
  /*      → Next.js (:3000)
```

Next.js uses `next.config.js` rewrites so that `/api/*` in the browser proxies to `API_URL` server-side (avoids CORS in dev). In production, Nginx handles the same split. WebSocket upgrade headers are explicitly forwarded in `nginx/default.conf` via a `map $http_upgrade $connection_upgrade` block with `proxy_read_timeout 3600s` to keep long downloads alive.

---

### Backend (`backend/`)

| Package | Role |
|---|---|
| `services/spotify.go` | Wraps `zmb3/spotify` — `GetPlaylistMetadata`, `GetPlaylistTracks` (paginated), `GetTrack`, `GetTrackItem` (wraps `GetTrack` as a 1-element `[]TrackDTO`, for downloads), `GetPlaylistItems` (all pages, for downloads), `GetAlbumMetadata`, `GetAlbumTracksPaged`, `GetAlbumItems` (all pages, for downloads) |
| `services/youtube.go` | Shells out to `yt-dlp` — searches top-5 results, picks best duration match, or streams raw audio. `DownloadToFile` takes an extension-less base path plus `AudioFormat`/`AudioQuality`, and returns the real final path — the extension isn't known ahead of time (`mp3` vs whatever native codec YouTube served for `original`), so it's read from yt-dlp's own `--print after_move:...` output rather than guessed |
| `services/metadata.go` | `WriteMP3Metadata` — embeds Spotify metadata + cover art into a downloaded MP3 via `ffmpeg` (no re-encode); skipped entirely for `AudioFormatOriginal` jobs (no ID3/atom tagging pipeline exists for native m4a/opus yet). `CoverMode` folder mode skips the per-track APIC embed so the orchestrator can write one shared `cover.jpg` instead |
| `services/orchestrator.go` | Implements `queue.DownloadService` — resolves the job's track list (playlist/album/single-track, based on `Job.Type`) → parallel download, throttled by `Orchestrator.downloadSem`, honoring `Job.Options` (format/quality/cover mode/`.m3u8`) → tags each file via `WriteMP3Metadata` (mp3 jobs only) → zip → progress via channel |
| `internal/queue/queue.go` | Buffered channel queue (cap 100); `StartWorkers(n)` spawns goroutines; relays `ProgressMessage` to WebSocket hub |
| `internal/ws/hub.go` | Job-ID-keyed WebSocket hub; dead connections removed on write error; job key deleted when subscriber list empties |
| `handlers/handlers.go` | `NewHandler` constructor; async routes: `StartPlaylistDownload`, `StartAlbumDownload`, `StartTrackDownload`, WebSocket, serve ZIP |
| `handlers/playlist.go` | `GetPlaylist` — offset=0 returns metadata+tracks; offset>0 returns tracks only (infinite scroll) |
| `handlers/album.go` | `GetAlbum` — same offset=0/offset>0 pagination shape as `GetPlaylist` |
| `handlers/track.go` | `GetTrackDetails`, `GetTrackVideo`, `DownloadTrackAudio` (legacy immediate raw-audio stream, no ID3 tags — unused by the frontend; prefer the async `StartTrackDownload` job for a tagged MP3) |
| `models/types.go` | **Single source of truth** for all shared types; drives TypeScript generation via `tygo` |

**Constructor pattern:** every service and component has a `New*` constructor. Wire them in `server.go` in order:
1. `services.NewSpotifyService(ctx, clientID, clientSecret)` — fails fast if auth fails
2. `services.NewYouTubeService()` — panics if `yt-dlp` is absent
3. `services.NewOrchestrator(spotify, youtube, maxConcurrentDownloads)`
4. `ws.NewHub()`
5. `queue.NewQueue(hub, orchestrator, 100)`
6. `handlers.NewHandler(spotify, youtube, queue, hub)`

**Async download flow:** the same pipeline serves playlists, albums, and single tracks — only the enqueued `Job.Type` (`"playlist" | "album" | "track"`) differs, and `Orchestrator.ProcessDownloadJob` branches on it to resolve the track list (`GetPlaylistItems` / `GetAlbumItems` / `GetTrackItem`) before running the identical download → tag → zip steps.

**Track-level rate limiting:** `Orchestrator` is constructed once in `server.go` and reused by every job the queue ever processes, so its `downloadSem` channel (buffered to `MAX_CONCURRENT_DOWNLOADS`, default 5) is shared across all of them. This caps how many tracks are searched/downloaded/tagged at once *system-wide* — independent of how many jobs or users are active — rather than per job. `MAX_CONCURRENT_JOBS` (default 5, passed to `queue.StartWorkers`) separately caps how many jobs are actively orchestrated (fetching metadata, zipping) at once; jobs beyond that queue up in the buffered job channel but all active jobs still draw from the single `downloadSem` pool. Because `ws.Hub.Broadcast` holds one mutex across every job's subscribers, `hub.go` sets a write deadline on each `WriteJSON` — without it, one stalled WebSocket client could block progress delivery (and therefore the shared semaphore, via blocked `progressChan` sends) for every job, not just its own.
1. `POST /api/playlist/:id/download` (or `/api/album/:id/download`, `/api/track/:id/download`) → creates UUID job, pushes to queue, returns `{job_id, ws_url}`
2. Worker picks up job → calls `Orchestrator.ProcessDownloadJob` → sends `ProgressMessage` to `progressChan`
3. Queue worker relays progress from `progressChan` → `ws.Hub.Broadcast`
4. Client connects to `GET /api/ws?job_id=<id>` → receives `ProgressMessage` JSON
5. On `type: complete` → client fetches `GET /api/download/:jobId` to stream the ZIP (even for a single-track job, the file is a ZIP containing one MP3 — this keeps `ServeDownloadFile` and the frontend fetch/save logic uniform across all three job types)

**Temporary files:** stored in `backend/tmp/` — raw MP3s in `{jobID}_raw/` (deleted after zipping via `defer os.RemoveAll`), final `{jobID}.zip` left on disk for download. In Docker, `./backend/tmp` is bind-mounted so ZIPs survive restarts.

**Download options (`models.DownloadOptions`, on every `Job`):** all three `Start*Download` handlers bind an optional JSON body via `parseDownloadOptions` (in `handlers/handlers.go`) — an empty/missing body just falls back to defaults (`mp3`, `high`, `embedded`, no `.m3u8`), so older callers keep working unchanged.
- **`Format`** (`mp3` | `original`): `original` skips both the ffmpeg re-encode and the whole `WriteMP3Metadata` pass — file is exactly what yt-dlp extracted (native codec, usually opus or m4a), untagged. Faster, but there's no tagging pipeline for it yet.
- **`Quality`** (`low` | `medium` | `high`, mp3 only): maps to yt-dlp's `--audio-quality` — low=96K, medium=128K, high=`0` (best-effort VBR). `high` deliberately has no fixed kbps target since YouTube's own source audio rarely exceeds ~160kbps; claiming a bigger number would be misleading.
- **`CoverMode`** (`embedded` | `folder`): `folder` only makes sense for album jobs (every track shares one cover already) — the orchestrator writes a single `cover.jpg` into the zip root instead of a per-track APIC frame.
- **`IncludeM3U`**: writes an extended `#EXTM3U`/`#EXTINF` `playlist.m3u8` listing tracks in original order (skipped for single-track jobs). Built from a pre-sized, index-addressed results slice in the orchestrator — download goroutines finish out of order, so each one only ever writes its own index (no locking needed).

---

### Frontend (`frontend/src/`)

All filenames are lowercase kebab-case. Never create files with uppercase letters.

**All UI copy is lowercase.** Every string the app itself writes (labels, headings, buttons, placeholders, status messages, empty states, `aria-label`s, `alt` text) is written lowercase in the source, not transformed with CSS, so the accessibility tree matches what is rendered. Content that comes from Spotify (track, artist, album and playlist names, descriptions, copyright lines) keeps its own casing. Dates are lowercased in `formatDate`/`formatReleaseDate` because the app formats them. The backend's `ProgressMessage` strings are lowercase for the same reason: they render directly in the downloads panel.

| Path | Role |
|---|---|
| `styles/globals.css` | The token layer. Dark is the designed reference and light is composed from it by hand; every token exists in both. Also themes the surfaces the app does not draw: selection, caret, focus ring, scrollbars |
| `lib/api.ts` | Axios instance; empty `baseURL` client-side (uses Next.js rewrites), `API_URL` server-side |
| `lib/download-api.ts` | `DownloadType`, `initiateDownload(type, id, options?)`, `buildDownloadFilename`, `triggerFileDownload` (blob fetch → browser save) |
| `lib/spotify.ts` | `parseSpotifyRef` accepts share links, locale-prefixed links (`/intl-es/album/<id>`), links carrying `?si=`, and bare `spotify:album:<id>` URIs. `TYPE_LABEL` holds the lowercase type names |
| `lib/storage.ts` | `localStorage` that never throws. Private windows and blocked site data make the accessor itself throw, so every read and write is guarded |
| `lib/utils.ts` | `cn`, `formatDuration` → M:SS, `formatTotalDuration` → `1 hr 12 min`, `formatReleaseDate` (renders only the precision Spotify actually supplied), `formatDate`, `joinArtists` |
| `hooks/use-downloads.tsx` | **The job model.** A provider owning many concurrent jobs, one WebSocket each, persisted to `localStorage` under `sdl.jobs.v2`. Rehydrates on mount and rejoins anything still in flight |
| `hooks/use-preview-player.tsx` | One shared `<audio>` element for the whole app, so starting a preview always stops the previous one |
| `hooks/use-infinite-tracks.ts` | Offset pagination shared by playlist and album. The server-rendered payload is page 0, so the list paints before any fetch |
| `hooks/use-recent.ts` | Recently opened resources, per browser, capped at 8. Gives the landing page substance for a returning user |
| `hooks/use-intersection-observer.ts` | Infinite-scroll trigger. Takes primitive deps, not an options object |
| `hooks/use-media-query.ts` | SSR-safe; returns false until mounted so it never mismatches |
| `types/api.ts` | **Generated** by `tygo` from `backend/models/types.go` — do not edit manually |
| `components/shell/` | `app-shell` (skip link, top bar, main, player, dock), `top-bar` (brand, persistent paste field with ⌘K, downloads trigger with active count, theme toggle), `brand`, `theme-toggle` (system → light → dark) |
| `components/url-field.tsx` | The one way into the app. `hero` on the landing page, `bar` in the top bar. Validates as you type and routes on Enter |
| `components/downloads/` | `downloads-dock` (persistent panel; overlays without stealing focus on desktop, modal sheet below `lg`), `job-row`, `download-button` (owns per-browser option persistence under `sdl.options.v1`), `download-options-form` |
| `components/collection/` | `collection-header` (shared masthead), `track-list` (real `<table>`, index swaps to a play control on hover/focus), `playlist-view`, `album-view` |
| `components/track/` | Track detail with the deep-metadata list: album, release date, position, duration, ISRC, popularity, label, copyright |
| `components/player/` | `play-button` (30s preview), `now-playing-bar` (appears only while a clip is loaded) |
| `components/ui/` | Primitives on the new tokens: button, input, badge, progress, separator, skeleton, spinner, tooltip, popover, switch, segmented, cover-art |

Data fetching uses TanStack Query. Playlist and album tables use offset-based infinite scroll via `GET /api/{playlist,album}/:id?offset=N&limit=N`.

**Downloads are first-class objects, not page state.** Starting one from any page pushes a job into the provider, opens the dock, and connects a socket. Navigating away does not cancel it. On reload, jobs that were mid-flight reconnect. Jobs that finished while the tab was closed cannot be recovered from the hub, which deletes the job key once its subscriber list empties, so after 10 seconds of silence a rejoining job falls to an `unknown` state offering a manual "try saving the file" action against `GET /api/download/:jobId`.

**`previewUrl` is usually empty.** Spotify deprecated `preview_url` for most applications in late 2024. The play control stays visible and disabled with a tooltip explaining why, rather than vanishing and making rows reflow.

**WebSocket URL in `use-downloads.tsx`:**
- Dev: `NEXT_PUBLIC_WS_URL` is set → `${NEXT_PUBLIC_WS_URL}/api/ws?job_id={id}`
- Prod: unset → falls back to `ws://${window.location.host}/api/ws?job_id={id}` (Nginx proxies it)

---

### Type Sync (Go → TypeScript)

`frontend/src/types/api.ts` is generated from `backend/models/types.go` using `tygo` (config in `tygo.yaml`). Struct tags control the output (e.g. `tstype:"'playlist' | 'track'"`). In Docker, the frontend `Dockerfile` runs tygo in a generation stage before `npm run build`.

---

### Docker internals

- `backend` build context: `./backend` (Dockerfile only sees that directory)
- `frontend` build context: `.` (repo root) so the tygo-gen stage can read `backend/models/types.go` and `tygo.yaml`
- `API_URL=http://backend:1323` is passed as both a build arg (for `next.config.js` rewrites) and a runtime env var (for SSR)
- `NEXT_PUBLIC_WS_URL` is never passed in Docker — intentional
- `cookies.txt` is bind-mounted into the backend container as read-only (`/app/cookies.txt`)
