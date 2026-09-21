# spotify-downloader

paste a spotify link, get a zip of mp3s. it reads the track list and metadata from the spotify api, finds a matching youtube video for each track with yt-dlp, downloads the audio, tags it, and packages the result.

this is a rewrite of the original spotify-downloader, which did everything in the browser with ytdl-core and ffmpeg.wasm. that version is retired. this one is a go backend with a next.js frontend, self-hosted behind nginx.

## how it works

tracks, albums and playlists all work. the frontend accepts share links, locale-prefixed links like `open.spotify.com/intl-es/album/<id>`, links with `?si=` params, and bare `spotify:album:<id>` uris.

opening a link shows the collection: cover art, track table with artists, duration, explicit flags, release date, and for single tracks the deeper metadata (isrc, popularity, label, copyright). playlist and album tables paginate with infinite scroll. 30-second previews play from a single shared audio element, though spotify deprecated `preview_url` for most apps in late 2024, so the play control is usually disabled with a tooltip saying why.

starting a download posts to `/api/{track,album,playlist}/:id/download`, which creates a uuid job and drops it on a buffered queue. worker goroutines pick jobs up and run them through the orchestrator: resolve the track list, download tracks in parallel under a shared semaphore, tag each file, zip the result. progress goes over a websocket at `/api/ws?job_id=<id>`, and on completion the client fetches the zip from `/api/download/:jobId`. single-track jobs also return a zip, just with one file in it.

download options per job:

- format: `mp3` (re-encoded so it can be tagged) or `original` (whatever native codec youtube served, untagged)
- quality: `low` (96k), `medium` (128k), `high` (best-effort vbr), mp3 only
- cover art: embedded per track, or one `cover.jpg` in the zip root (album jobs)
- optional `playlist.m3u8` in original track order

tagging is done with ffmpeg and does not re-encode. it writes title, artist, album, cover art and the rest from spotify's metadata, not from the youtube video.

downloads are tracked as jobs, not page state. they live in a provider, persist to localstorage, and survive navigation and reloads. a job that was still running when you closed the tab reconnects; one that finished while the tab was closed falls back to a manual "try saving the file" action, since the websocket hub drops a job once nobody is subscribed to it.

two limits are enforced globally rather than per job: `MAX_CONCURRENT_DOWNLOADS` caps how many tracks are being fetched and tagged at once across the whole server, and `MAX_CONCURRENT_JOBS` caps how many jobs are actively orchestrated.

## stack

go 1.25 with echo v4, gorilla/websocket and zmb3/spotify on the backend. next.js 15 (app router) with react 19, tanstack query, tailwind v4 and base-ui/radix primitives on the frontend. yt-dlp and ffmpeg are shelled out to. nginx sits in front of both containers.

shared types live in `backend/models/types.go` and are generated into `frontend/src/types/api.ts` with tygo. don't edit the generated file.

## environment variables

copy `.env.example` to `.env` and fill it in.

| var | required | what it does |
|---|---|---|
| `SPOTIFY_CLIENT_ID` | yes | spotify api credentials |
| `SPOTIFY_CLIENT_SECRET` | yes | spotify api credentials |
| `API_URL` | yes | backend url for next.js server-side rewrites. `http://localhost:1323` in dev, set to the internal container url by docker |
| `NEXT_PUBLIC_WS_URL` | dev only | direct websocket url to the go server. next.js rewrites proxy http but not websocket upgrades, so dev needs this. leave it unset in production, where nginx handles the upgrade |
| `MAX_CONCURRENT_DOWNLOADS` | no | defaults to 5 |
| `MAX_CONCURRENT_JOBS` | no | defaults to 5 |

### the spotify credentials need a premium account

you get a client id and secret by registering an app in the [spotify developer dashboard](https://developer.spotify.com/dashboard). as of now spotify requires a **spotify premium** subscription on the account before it will let you create an application. a free account can log into the dashboard but cannot create an app, so there is no way to get credentials without premium. there is no workaround for this in the app, and nothing here works without those two values.

### cookies.txt

yt-dlp needs a cookie jar to download audio reliably. export your youtube cookies in netscape format to `cookies.txt` at the repo root. it is gitignored, and docker bind-mounts it read-only into the backend container. the backend copies it to a writable path at runtime, since yt-dlp rewrites the jar on every run.

on platforms without volume mounts, set `COOKIES_B64` instead — the base64-encoded contents of the same file. the backend decodes it and writes it to the runtime path itself if no `cookies.txt` is found.

## deployment

self-hosted with docker compose. three containers: nginx, the go backend, and the next.js frontend. nginx listens on port 80, routes `/api/*` to the backend and everything else to the frontend, and forwards websocket upgrades with a long read timeout so downloads don't get cut off.

```bash
cp .env.example .env   # then fill in the spotify credentials
docker compose up --build
```

or `make docker-up`, which does the same. the app is then on `http://localhost:80`. `make docker-down` stops it.

the backend image installs ffmpeg and yt-dlp, and self-updates yt-dlp on start so the container doesn't go stale between rebuilds. `backend/tmp` is bind-mounted so finished zips survive a restart.

## local development

install once:

```bash
go install github.com/air-verse/air@latest    # live reload
go install github.com/gzuidhof/tygo@latest    # go -> ts types
cd frontend && npm install
```

you also need `yt-dlp` and `ffmpeg` on your path. the backend panics at startup if yt-dlp is missing.

then run the two halves in separate terminals:

```bash
make backend-dev    # go backend on :1323, live reload via air
make frontend       # next.js dev server on :3000
```

`make backend` runs the backend without live reload. the backend loads `../.env` relative to `backend/`, so it picks up the root `.env` on its own.

after changing `backend/models/types.go`:

```bash
make gen            # regenerates frontend/src/types/api.ts
```

frontend checks are `npm run typecheck`, `npm run check` (lint + typecheck) and `npm run format:write`, all from `frontend/`.

## contributing

it's a hobby project with one maintainer, so nothing formal. fork it, branch off main, keep the change focused, open a pr. run `make gen` if you touched the go models and `npm run check` if you touched the frontend. issues are fine for bugs and ideas.

one house rule: all ui copy the app writes is lowercase in the source, not lowercased with css. text that comes from spotify keeps its own casing.

## license

mit. see [LICENSE](LICENSE).
