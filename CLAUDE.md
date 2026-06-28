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
| `services/spotify.go` | Wraps `zmb3/spotify` — `GetPlaylistMetadata`, `GetPlaylistTracks` (paginated), `GetTrack`, `GetPlaylistItems` (all pages, for downloads) |
| `services/youtube.go` | Shells out to `yt-dlp` — searches top-5 results, picks best duration match, downloads MP3 to file, or streams raw audio |
| `services/orchestrator.go` | Implements `queue.DownloadService` — fetches all tracks → parallel download (semaphore 3) → zip → progress via channel |
| `internal/queue/queue.go` | Buffered channel queue (cap 100); `StartWorkers(n)` spawns goroutines; relays `ProgressMessage` to WebSocket hub |
| `internal/ws/hub.go` | Job-ID-keyed WebSocket hub; dead connections removed on write error; job key deleted when subscriber list empties |
| `handlers/handlers.go` | `NewHandler` constructor; async routes: start job, WebSocket, serve ZIP |
| `handlers/playlist.go` | `GetPlaylist` — offset=0 returns metadata+tracks; offset>0 returns tracks only (infinite scroll) |
| `handlers/track.go` | `GetTrackDetails`, `GetTrackVideo`, `DownloadTrackAudio` |
| `models/types.go` | **Single source of truth** for all shared types; drives TypeScript generation via `tygo` |

**Constructor pattern:** every service and component has a `New*` constructor. Wire them in `server.go` in order:
1. `services.NewSpotifyService(ctx, clientID, clientSecret)` — fails fast if auth fails
2. `services.NewYouTubeService()` — panics if `yt-dlp` is absent
3. `services.NewOrchestrator(spotify, youtube)`
4. `ws.NewHub()`
5. `queue.NewQueue(hub, orchestrator, 100)`
6. `handlers.NewHandler(spotify, youtube, queue, hub)`

**Async download flow:**
1. `POST /api/playlist/:id/download` → creates UUID job, pushes to queue, returns `{job_id, ws_url}`
2. Worker picks up job → calls `Orchestrator.ProcessDownloadJob` → sends `ProgressMessage` to `progressChan`
3. Queue worker relays progress from `progressChan` → `ws.Hub.Broadcast`
4. Client connects to `GET /api/ws?job_id=<id>` → receives `ProgressMessage` JSON
5. On `type: complete` → client fetches `GET /api/download/:jobId` to stream the ZIP

**Temporary files:** stored in `backend/tmp/` — raw MP3s in `{jobID}_raw/` (deleted after zipping via `defer os.RemoveAll`), final `{jobID}.zip` left on disk for download. In Docker, `./backend/tmp` is bind-mounted so ZIPs survive restarts.

---

### Frontend (`frontend/src/`)

All filenames are lowercase kebab-case. Never create files with uppercase letters.

| Path | Role |
|---|---|
| `lib/api.ts` | Axios instance; empty `baseURL` client-side (uses Next.js rewrites), `API_URL` server-side |
| `lib/download-api.ts` | `initiateDownload` (POST job) + `triggerFileDownload` (blob fetch → browser save) |
| `lib/utils.ts` | `cn`, `formatDuration(ms)` → MM:SS, `formatDate` |
| `hooks/use-playlist-download.ts` | Download state machine: idle → initializing → processing → downloading → complete/error; owns WebSocket lifecycle |
| `hooks/use-intersection-observer.ts` | Intersection observer for infinite scroll trigger |
| `types/api.ts` | **Generated** by `tygo` from `backend/models/types.go` — do not edit manually |
| `components/home/` | Landing page with Spotify URL input and validation |
| `components/playlist/` | Playlist page: header, TanStack Table with infinite scroll, download button |
| `components/track/` | Track detail view: album art, title, artists, album, duration, Spotify link |
| `components/ui/` | shadcn/ui components |

Data fetching uses TanStack Query. The playlist table uses offset-based infinite scroll — tracks fetched in pages via `GET /api/playlist/:id?offset=N&limit=N`.

**WebSocket URL in `use-playlist-download.ts`:**
- Dev: `process.env.NEXT_PUBLIC_WS_URL` is set → `${NEXT_PUBLIC_WS_URL}/api/ws?job_id={id}`
- Prod: env var not set → falls back to `ws://${window.location.host}/api/ws?job_id={id}` (Nginx proxies it)

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
