FROM golang:1.25-alpine AS builder

WORKDIR /app

COPY go.mod go.sum ./
RUN go mod download

COPY . .

RUN CGO_ENABLED=0 GOOS=linux go build -o main .

FROM alpine:latest

RUN apk --no-cache add ca-certificates ffmpeg curl \
    && curl -L https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp \
       -o /usr/local/bin/yt-dlp \
    && chmod +x /usr/local/bin/yt-dlp

WORKDIR /app

COPY --from=builder /app/main .

EXPOSE 1323

# Self-update yt-dlp on each start so the container stays current without a rebuild.
# The update is best-effort — if the network is unavailable, startup continues anyway.
# COOKIES_B64: optional base64-encoded cookies.txt (set in Coolify env vars).
# If present it is decoded to /app/cookies.txt before the server starts.
# For local dev the file is bind-mounted instead (see docker-compose.yml).
CMD ["sh", "-c", "yt-dlp -U --quiet 2>&1 || true; [ -n \"$COOKIES_B64\" ] && echo \"$COOKIES_B64\" | base64 -d > /app/cookies.txt; ./main"]
